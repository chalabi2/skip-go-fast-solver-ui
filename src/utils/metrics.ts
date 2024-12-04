import { ethers } from 'ethers';
import { BASE_TRANSFER_GATEWAY_ABI } from '../constants/abis';
import { ChainConfig } from '../types';

// Chain configurations
export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    domain: 1,
    name: "Ethereum",
    rpcUrl: "https://eth.chandrastation.com",
    token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fastTransferGateway: "0xe7935104c9670015b21c6300e5b95d2f75474cda",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  },
  {
    domain: 43114,
    name: "Avalanche",
    rpcUrl: "https://avax.chandrastation.com/ext/bc/C/rpc",
    token: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    fastTransferGateway: "0xD415B02A7E91dBAf92EAa4721F9289CFB7f4E1cF",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  },
  {
    domain: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    token: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    fastTransferGateway: "0x0f479de4fd3144642f1af88e3797b1821724f703",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  },
  {
    domain: 42161,
    name: "Arbitrum",
    rpcUrl: "https://arb.chandrastation.com",
    token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    fastTransferGateway: "0x23cb6147e5600c23d1fb5543916d3d5457c9b54c",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  },
  {
    domain: 8453,
    name: "Base",
    rpcUrl: "https://base.chandrastation.com",
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    fastTransferGateway: "0x43d090025aaa6c8693b71952b910ac55ccb56bbb",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  },
  {
    domain: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    token: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    fastTransferGateway: "0x3ffaf8d0d33226302e3a0ae48367cf1dd2023b1f",
    mailbox: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3"
  }
];

// Type definitions
export interface OsmoOrderFill {
  order_id: string;
  filler: string;
  source_domain: number;
}

export interface OrderWithProfit {
  orderId: string;
  chainId: string;
  chainName: string;
  amount: string;
  profit: string;
  timestamp: number;
}

export interface ChainProfitResult {
  totalProfit: string;
  ordersWithProfits: OrderWithProfit[];
}

export interface GasMetric {
  metric: {
    source_chain_id: string;
    source_chain_name: string;
    gas_token_symbol: string;
    gas_balance: number;
  };
  value: [number, number];
}

export interface ChainBalance {
  chainId: string;
  chainName: string;
  balance: number;
}

// Add this interface near the other interfaces
export interface PrometheusQueryResult {
  metric: {
    __name__: string;
    [key: string]: string;
  };
  value: [number, number];
}

// Add this near the top with other interfaces
interface ErrorWithCode extends Error {
  code?: string;
}

// Settlement and profit calculation
async function getSettlementDetailsForChain(
  chainConfig: ChainConfig,
  orders: OsmoOrderFill[]
): Promise<ChainProfitResult> {
  console.log(`Processing ${chainConfig.name} orders...`);
  
  // Filter orders for this chain
  const chainOrders = orders.filter(order => order.source_domain === chainConfig.domain);
  console.log(`Found ${chainOrders.length} orders for ${chainConfig.name}`);
  
  try {
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    await provider.ready;
    
    const contract = new ethers.Contract(
      chainConfig.fastTransferGateway,
      BASE_TRANSFER_GATEWAY_ABI,
      provider
    );

    // Special handling for Polygon and Optimism - process in smaller batches
    const batchSize = chainConfig.name === "Polygon" ? 5 : 
                     chainConfig.name === "Optimism" ? 9 : 
                     chainOrders.length;

    const processOrder = async (order: OsmoOrderFill, retryCount = 0): Promise<OrderWithProfit | null> => {
      try {
        const orderIdHex = order.order_id.startsWith('0x') 
          ? order.order_id 
          : `0x${order.order_id}`;
        const paddedOrderId = ethers.zeroPadValue(orderIdHex, 32);
        
        const details = await contract.settlementDetails(paddedOrderId);
        
        if (details && details.amount) {
          const amountBigInt = details.amount;
          const profit = (amountBigInt * 1n) / 1000n; // 0.1% = 1/1000
          
          return {
            orderId: order.order_id,
            chainId: chainConfig.domain.toString(),
            chainName: chainConfig.name,
            amount: ethers.formatUnits(amountBigInt, 6),
            profit: ethers.formatUnits(profit, 6),
            timestamp: Math.floor(Date.now() / 1000)
          };
        }
        return null;
      } catch (error) {
        const err = error as ErrorWithCode;
        // Handle specific error cases
        if (err.code === 'CALL_EXCEPTION' && retryCount < 3) {
          // Add exponential backoff delay
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return processOrder(order, retryCount + 1);
        }
        
        console.error(`Error processing ${chainConfig.name} order ${order.order_id}:`, error);
        return null;
      }
    };

    const processOrderBatch = async (orders: OsmoOrderFill[]) => {
      const results = await Promise.all(
        orders.map(order => processOrder(order))
      );
      return results;
    };

    let allOrderDetails: (OrderWithProfit | null)[] = [];
    
    // Process orders in batches if needed
    for (let i = 0; i < chainOrders.length; i += batchSize) {
      const batch = chainOrders.slice(i, i + batchSize);
      const batchResults = await processOrderBatch(batch);
      allOrderDetails = [...allOrderDetails, ...batchResults];
      
      // Add a dynamic delay between batches for rate-limited RPCs
      if (chainConfig.name === "Polygon" || chainConfig.name === "Optimism") {
        const delayMs = chainConfig.name === "Polygon" ? 1000 : 500;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    const validOrders = allOrderDetails.filter((order): order is NonNullable<typeof order> => order !== null);
    
    const totalProfitBigInt = validOrders.reduce((acc, order) => {
      return acc + ethers.parseUnits(order.profit, 6);
    }, 0n);
    
    return {
      totalProfit: ethers.formatUnits(totalProfitBigInt, 6),
      ordersWithProfits: validOrders
    };
  } catch (error) {
    console.error(`Error processing ${chainConfig.name} chain:`, error);
    return {
      totalProfit: "0",
      ordersWithProfits: []
    };
  }
}

export async function calculateChainProfits(
  chainConfig: ChainConfig, 
  orders: OsmoOrderFill[]
): Promise<ChainProfitResult> {
  return getSettlementDetailsForChain(chainConfig, orders);
}



// USDC balance tracking
export async function getUSDCBalance(config: ChainConfig): Promise<ChainBalance> {
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    await provider.ready;
    
    const token = new ethers.Contract(
      config.token,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    
    const balance = await token.balanceOf(config.fastTransferGateway);
    console.log(`USDC balance for ${config.name}:`, ethers.formatUnits(balance, 6));
    
    return {
      chainId: config.domain.toString(),
      chainName: config.name,
      balance: Number(ethers.formatUnits(balance, 6))
    };
  } catch (error) {
    console.error(`Error getting USDC balance for ${config.name}:`, error);
    return {
      chainId: config.domain.toString(),
      chainName: config.name,
      balance: 0
    };
  }
}