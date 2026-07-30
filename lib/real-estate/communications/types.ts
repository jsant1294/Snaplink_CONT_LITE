export type CommunicationChannel = "email" | "sms";
export type DeliveryStatus = "draft" | "scheduled" | "queued" | "sent" | "delivered" | "failed" | "cancelled" | "blocked";
export interface ProviderMessage { to: string; subject?: string; body: string; }
export interface ProviderResult { status: "sent" | "preview" | "disabled" | "failed"; provider: string; messageId?: string; error?: string; }
export interface CommunicationProvider {
  readonly name: string;
  readonly channel: CommunicationChannel;
  readonly sendsExternally: boolean;
  send(message: ProviderMessage): Promise<ProviderResult>;
}
