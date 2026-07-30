export const AI_FEATURES = ["property_description","lead_score","lead_summary","conversation_summary","transaction_summary","document_classification","document_extraction","offer_comparison","inspection_summary","task_suggestions","follow_up_suggestions","brokerage_insights","market_insights"] as const;
export type RealEstateAiFeature=(typeof AI_FEATURES)[number];
export type RealEstateAiProviderType="disabled"|"mock"|"openai"|"anthropic";
export interface RealEstateAiTextRequest{model:string;system:string;content:string;maxOutputTokens:number;temperature:number;timeoutMs:number}
export interface RealEstateAiTextResult{text:string;model:string;inputTokens:number;outputTokens:number;latencyMs:number;requestId?:string}
export interface RealEstateAiStructuredRequest<T> extends RealEstateAiTextRequest{validate:(value:unknown)=>value is T}
export interface RealEstateAiStructuredResult<T> extends Omit<RealEstateAiTextResult,"text">{value:T}
export interface RealEstateAiEmbeddingRequest{model:string;content:string;timeoutMs:number}
export interface RealEstateAiEmbeddingResult{vector:number[];model:string;inputTokens:number;latencyMs:number}
export interface RealEstateAiProvider{readonly name:string;generateText(input:RealEstateAiTextRequest):Promise<RealEstateAiTextResult>;generateStructured<T>(input:RealEstateAiStructuredRequest<T>):Promise<RealEstateAiStructuredResult<T>>;embed?(input:RealEstateAiEmbeddingRequest):Promise<RealEstateAiEmbeddingResult>}
export interface RealEstateAiConfig{enabled:boolean;provider:RealEstateAiProviderType;defaultModel:string;fastModel:string;structuredModel:string;embeddingModel:string;allowedModels:Set<string>;maxInputTokens:number;maxOutputTokens:number;monthlyTenantLimit:number;dailyUserLimit:number;redactionEnabled:boolean;logContent:false;testMode:boolean;timeoutMs:number;maxConcurrent:number;credential?:string}
export interface AiSourceReference{type:string;id:string;timestamp?:string;page?:number}
export interface LeadScoreResult{score:number;grade:"A"|"B"|"C"|"D";confidence:number;factors:Array<{key:string;label:string;impact:"positive"|"neutral"|"negative";explanation:string}>;missingSignals:string[];suggestedNextAction?:string}
