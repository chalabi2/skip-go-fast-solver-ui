import { CHAIN_CONFIGS } from "./metrics";

export const fromDomainToChainName = (domain: string) => {
  return CHAIN_CONFIGS.find((config) => config.domain.toString() === domain)?.name;
};
