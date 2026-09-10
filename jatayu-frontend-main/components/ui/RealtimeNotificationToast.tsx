"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { getAdminToken, getToken } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
type Notice = { id: string; title: string; body: string; href?: string | null };
export default function RealtimeNotificationToast() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => { const token = getToken() || getAdminToken(); if (!token) return; const socket = connectSocket(token);
    const receive = (item: Notice) => { setNotice(item); window.dispatchEvent(new CustomEvent("jatayu:notification", { detail: item })); };
    socket.on("notification:new", receive); return () => { socket.off("notification:new", receive); }; }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 8000); return () => clearTimeout(timer); }, [notice]);
  if (!notice) return null;
  const content = <><Bell size={18} /><span><strong>{notice.title}</strong><br />{notice.body}</span></>;
  return <div role="status" aria-live="polite" style={{position:"fixed",right:24,top:24,zIndex:10000,width:360,maxWidth:"calc(100vw - 32px)",padding:16,borderRadius:12,background:"#fff",color:"#172033",boxShadow:"0 12px 40px rgba(0,0,0,.2)",display:"flex",gap:12}}>
    {notice.href ? <Link href={notice.href} onClick={() => setNotice(null)} style={{display:"flex",gap:12,flex:1,color:"inherit",textDecoration:"none"}}>{content}</Link> : <span style={{display:"flex",gap:12,flex:1}}>{content}</span>}
    <button aria-label="Dismiss notification" onClick={() => setNotice(null)} style={{border:0,background:"transparent",cursor:"pointer"}}><X size={16}/></button>
  </div>;
}
