export const MAILBOX_ABI = [
  {
    inputs: [{ internalType: "uint32", name: "_localDomain", type: "uint32" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "hook", type: "address" },
    ],
    name: "DefaultHookSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "module",
        type: "address",
      },
    ],
    name: "DefaultIsmSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint32",
        name: "destination",
        type: "uint32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "recipient",
        type: "bytes32",
      },
      { indexed: false, internalType: "bytes", name: "message", type: "bytes" },
    ],
    name: "Dispatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "DispatchId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint32", name: "origin", type: "uint32" },
      {
        indexed: true,
        internalType: "bytes32",
        name: "sender",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "Process",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "ProcessId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "hook", type: "address" },
    ],
    name: "RequiredHookSet",
    type: "event",
  }
] as const;

export const FAST_TRANSFER_GATEWAY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "_token", type: "address", internalType: "address" },
      { name: "_mailbox", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "handle",
    inputs: [
      { name: "", type: "uint32", internalType: "uint32" },
      { name: "_sender", type: "bytes32", internalType: "bytes32" },
      { name: "_message", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "mailbox",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonce",
    inputs: [],
    outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "orders",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "sender", type: "bytes32", internalType: "bytes32" },
      { name: "recipient", type: "bytes32", internalType: "bytes32" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "nonce", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "submitOrder",
    inputs: [
      { name: "sender", type: "bytes32", internalType: "bytes32" },
      { name: "recipient", type: "bytes32", internalType: "bytes32" },
      { name: "amountIn", type: "uint256", internalType: "uint256" },
      { name: "amountOut", type: "uint256", internalType: "uint256" },
      { name: "destinationDomain", type: "uint32", internalType: "uint32" },
      { name: "timeoutTimestamp", type: "uint64", internalType: "uint64" },
      { name: "data", type: "bytes", internalType: "bytes" }
    ],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OrderSubmitted",
    inputs: [
      {
        name: "orderID",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "order",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OrderSettled",
    inputs: [
      {
        name: "orderID",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      }
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OrderRefunded",
    inputs: [
      {
        name: "orderID",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      }
    ],
    anonymous: false,
  }
] as const;

export const GOFAST_ABI = [
  {
    type: "event",
    name: "Open",
    inputs: [
      {
        name: "orderID",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "resolvedOrder",
        type: "tuple",
        indexed: false,
        internalType: "struct ResolvedCrossChainOrder",
        components: [
          { name: "user", type: "address", internalType: "address" },
          {
            name: "originChainId",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "openDeadline",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "fillDeadline",
            type: "uint32",
            internalType: "uint32",
          },
          {
            name: "maxSpent",
            type: "tuple[]",
            internalType: "struct Output[]",
            components: [
              { name: "token", type: "bytes", internalType: "bytes" },
              {
                name: "amount",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "recipient",
                type: "bytes32",
                internalType: "bytes32",
              },
              {
                name: "chainId",
                type: "uint64",
                internalType: "uint64",
              },
            ],
          },
          {
            name: "minReceived",
            type: "tuple[]",
            internalType: "struct Output[]",
            components: [
              { name: "token", type: "bytes", internalType: "bytes" },
              {
                name: "amount",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "recipient",
                type: "bytes32",
                internalType: "bytes32",
              },
              {
                name: "chainId",
                type: "uint64",
                internalType: "uint64",
              },
            ],
          }
        ],
      },
    ],
    anonymous: false,
  }
] as const;

export const BASE_TRANSFER_GATEWAY_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"AddressInsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},{"inputs":[],"name":"ERC1967NonPayable","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},{"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderAlreadySettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderRefunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderSettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"order","type":"bytes"}],"name":"OrderSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"PERMIT2","outputs":[{"internalType":"contract IPermit2","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"filler","type":"address"},{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder","name":"order","type":"tuple"}],"name":"fillOrder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"goFastCaller","outputs":[{"internalType":"contract GoFastCaller","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"_origin","type":"uint32"},{"internalType":"bytes32","name":"_sender","type":"bytes32"},{"internalType":"bytes","name":"_message","type":"bytes"}],"name":"handle","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint32","name":"_localDomain","type":"uint32"},{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_mailbox","type":"address"},{"internalType":"address","name":"_interchainSecurityModule","type":"address"},{"internalType":"address","name":"_permit2","type":"address"},{"internalType":"address","name":"_goFastCaller","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"repaymentAddress","type":"bytes32"},{"internalType":"bytes","name":"orderIDs","type":"bytes"}],"name":"initiateSettlement","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder[]","name":"orders","type":"tuple[]"}],"name":"initiateTimeout","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"interchainSecurityModule","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"localDomain","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mailbox","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"orderFills","outputs":[{"internalType":"bytes32","name":"orderID","type":"bytes32"},{"internalType":"address","name":"filler","type":"address"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"orderStatuses","outputs":[{"internalType":"enum OrderStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"bytes32","name":"repaymentAddress","type":"bytes32"},{"internalType":"bytes","name":"orderIDs","type":"bytes"}],"name":"quoteInitiateSettlement","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder[]","name":"orders","type":"tuple[]"}],"name":"quoteInitiateTimeout","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"}],"name":"remoteDomains","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_interchainSecurityModule","type":"address"}],"name":"setInterchainSecurityModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_mailbox","type":"address"}],"name":"setMailbox","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"domain","type":"uint32"},{"internalType":"bytes32","name":"remoteContract","type":"bytes32"}],"name":"setRemoteDomain","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"settlementDetails","outputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"submitOrder","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"uint256","name":"permitDeadline","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"submitOrderWithPermit","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"}] as const; 

export const ETH_TRANSFER_GATEWAY_ABI = [[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"AddressEmptyCode","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"AddressInsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"implementation","type":"address"}],"name":"ERC1967InvalidImplementation","type":"error"},{"inputs":[],"name":"ERC1967NonPayable","type":"error"},{"inputs":[],"name":"FailedInnerCall","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"UUPSUnauthorizedCallContext","type":"error"},{"inputs":[{"internalType":"bytes32","name":"slot","type":"bytes32"}],"name":"UUPSUnsupportedProxiableUUID","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderAlreadySettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderRefunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"}],"name":"OrderSettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orderID","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"order","type":"bytes"}],"name":"OrderSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"PERMIT2","outputs":[{"internalType":"contract IPermit2","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"filler","type":"address"},{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder","name":"order","type":"tuple"}],"name":"fillOrder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"goFastCaller","outputs":[{"internalType":"contract GoFastCaller","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"_origin","type":"uint32"},{"internalType":"bytes32","name":"_sender","type":"bytes32"},{"internalType":"bytes","name":"_message","type":"bytes"}],"name":"handle","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint32","name":"_localDomain","type":"uint32"},{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_mailbox","type":"address"},{"internalType":"address","name":"_interchainSecurityModule","type":"address"},{"internalType":"address","name":"_permit2","type":"address"},{"internalType":"address","name":"_goFastCaller","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"repaymentAddress","type":"bytes32"},{"internalType":"bytes","name":"orderIDs","type":"bytes"}],"name":"initiateSettlement","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder[]","name":"orders","type":"tuple[]"}],"name":"initiateTimeout","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"interchainSecurityModule","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"localDomain","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mailbox","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"orderFills","outputs":[{"internalType":"bytes32","name":"orderID","type":"bytes32"},{"internalType":"address","name":"filler","type":"address"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"orderStatuses","outputs":[{"internalType":"enum OrderStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"bytes32","name":"repaymentAddress","type":"bytes32"},{"internalType":"bytes","name":"orderIDs","type":"bytes"}],"name":"quoteInitiateSettlement","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"components":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"nonce","type":"uint32"},{"internalType":"uint32","name":"sourceDomain","type":"uint32"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct FastTransferOrder[]","name":"orders","type":"tuple[]"}],"name":"quoteInitiateTimeout","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"","type":"uint32"}],"name":"remoteDomains","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_interchainSecurityModule","type":"address"}],"name":"setInterchainSecurityModule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_mailbox","type":"address"}],"name":"setMailbox","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"domain","type":"uint32"},{"internalType":"bytes32","name":"remoteContract","type":"bytes32"}],"name":"setRemoteDomain","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"settlementDetails","outputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"submitOrder","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"sender","type":"bytes32"},{"internalType":"bytes32","name":"recipient","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint32","name":"destinationDomain","type":"uint32"},{"internalType":"uint64","name":"timeoutTimestamp","type":"uint64"},{"internalType":"uint256","name":"permitDeadline","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"submitOrderWithPermit","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"}]] as const;