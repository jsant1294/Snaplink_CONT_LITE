export const transitions={
 draft:["active","cancelled"],active:["offer_submitted","cancelled"],offer_submitted:["offer_accepted","cancelled"],
 offer_accepted:["due_diligence","cancelled"],due_diligence:["inspection","cancelled"],inspection:["financing","cancelled"],
 financing:["appraisal","cancelled"],appraisal:["clear_to_close","cancelled"],clear_to_close:["closed","cancelled"],closed:[],cancelled:[],
};
export const canTransition=(from,to)=>from===to||Boolean(transitions[from]?.includes(to));
export const applyBasisPointsValue=(cents,bps)=>{if(!Number.isSafeInteger(cents)||cents<0)throw new Error("invalid cents");if(!Number.isInteger(bps)||bps<0||bps>10000)throw new Error("invalid basis points");return Math.round(cents*bps/10000)};
export const sanitizeFilenameValue=name=>{const base=String(name).split(/[\\/]/).pop()||"document";const safe=base.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g,"_").replace(/\.+/g,".").slice(0,120);return safe&&safe!=="."?safe:"document"};
