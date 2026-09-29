export interface ProviderOption {
  name: string;
  color: string;
  isCustom?: boolean;
}

export const PROVIDERS: readonly [string, string][] = [
  ['GCash', '#007DFE'],
  ['Maya', '#1FBF6B'],
  ['MariBank', '#FF5722'],
  ['SeaBank', '#FF5722'],
  ['GoTyme', '#00A6A0'],
  ['BDO', '#0A3D91'],
  ['BPI', '#B3151B'],
  ['UnionBank', '#F26B21'],
  ['Metrobank', '#1B3F94'],
  ['Landbank', '#0B7A3E'],
  ['ShopeePay', '#EE4D2D'],
  ['GrabPay', '#00A651'],
  ['PayPal', '#003087'],
  ['Custom', '#1D1D1F'],
] as const;

export const DEFAULT_PROVIDER = PROVIDERS[0]; // GCash
