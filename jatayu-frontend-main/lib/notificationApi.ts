import { getAdminToken, getToken } from "@/lib/api";
import { publicApiBase } from "@/lib/publicApiBase";
export type AppNotification = { id:string; title:string; body:string; href?:string|null; readAt?:string|null; createdAt:string };
async function call(path:string, init?:RequestInit) { const response=await fetch(`${publicApiBase()}/api/notifications${path}`,{...init,headers:{Authorization:`Bearer ${getToken()||getAdminToken()||""}`,"Content-Type":"application/json"}}); const data=await response.json(); if(!response.ok) throw new Error(data.message); return data; }
export const fetchNotifications=()=>call("?page=1&limit=50") as Promise<{items:AppNotification[];unreadCount:number}>;
export const readNotification=(id:string)=>call(`/${encodeURIComponent(id)}/read`,{method:"PATCH"});
export const readAllNotifications=()=>call("/read-all",{method:"PATCH"});
