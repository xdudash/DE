"use client";
import { useMemo } from "react";
import { useProgress } from "../lib/progress/client";
type Labels = { title:string; total:string; day:string; empty:string };
export function ProgressActivity({lang,labels}:{lang:string;labels:Labels}) {
 const {attempts}=useProgress();
 const days=useMemo(()=>{
  const now=new Date();
  const first=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6);
  const bins=Array.from({length:7},(_,i)=>{const date=new Date(first);date.setDate(first.getDate()+i);return {date,count:0};});
  for(const attempt of attempts){const at=new Date(attempt.at);const bin=bins.find(x=>x.date.getFullYear()===at.getFullYear()&&x.date.getMonth()===at.getMonth()&&x.date.getDate()===at.getDate());if(bin)bin.count++;}
  return bins;
 },[attempts]);
 const total=days.reduce((n,x)=>n+x.count,0),max=Math.max(1,...days.map(x=>x.count));
 const weekday=new Intl.DateTimeFormat(lang,{weekday:"short"});
 return <section className="card progress-activity" aria-labelledby="progress-activity-heading">
  <h2 id="progress-activity-heading" className="card-title">{labels.title}</h2>
  <p className="muted small">{labels.total.replace("{count}",String(total))}</p>
  {total===0&&<p className="muted">{labels.empty}</p>}
  <ol className="activity-week" aria-label={labels.title}>{days.map(({date,count})=>{const day=weekday.format(date);return <li key={date.toISOString()} aria-label={day+": "+labels.day.replace("{count}",String(count))}><div className="activity-bar" aria-hidden="true"><span style={{blockSize:count?Math.max(8,count/max*100)+"%":"2px"}}/></div><strong>{count}</strong><span className="activity-day">{day}</span></li>;})}</ol>
 </section>;
}