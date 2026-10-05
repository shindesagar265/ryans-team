import type { DashboardMetric, Enrollment, MessageTemplate, PublicUser, Session, Student, SwimClass } from '@swimwave/shared';
import type { Program } from '../types';
import type { ApiClient } from './types';

const SESSION_KEY = 'swimwave-session';
const images: Record<string, string> = {
	'Water Confidence': 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=900&q=80',
	'Stroke Foundations': 'https://images.unsplash.com/photo-1530137073520-4ea6e2f10a48?auto=format&fit=crop&w=900&q=80',
	'Adult Technique': 'https://images.unsplash.com/photo-1600965962102-9d260a71890d?auto=format&fit=crop&w=900&q=80',
};
function endpoint(): string { return import.meta.env.VITE_APPS_SCRIPT_URL?.trim() || '/exec'; }
function getSession(): Session | null { const value=localStorage.getItem(SESSION_KEY);if(!value)return null;try{return JSON.parse(value) as Session}catch{localStorage.removeItem(SESSION_KEY);return null} }
function errorMessage(value:unknown,fallback:string):string { if(typeof value!=='object'||value===null||!('error' in value))return fallback;const error=value.error;return typeof error==='object'&&error!==null&&'message' in error&&typeof error.message==='string'?error.message:fallback; }
async function request<T>(action:string,method:'GET'|'POST'='GET',body?:object):Promise<T>{const url=new URL(endpoint(),window.location.origin);url.searchParams.set('action',action);const token=getSession()?.token;if(method==='GET'&&token)url.searchParams.set('token',token);const response=await fetch(url,method==='POST'?{method,headers:{Accept:'application/json','Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({...body,...(token?{token}:{})})}:{headers:{Accept:'application/json'}});let value:unknown;try{value=await response.json()}catch{throw new Error(`The API returned non-JSON (${response.status}).`)}if(!response.ok||(typeof value==='object'&&value!==null&&'error' in value))throw new Error(errorMessage(value,`API request failed (${response.status}).`));return value as T;}
function programs(classes:SwimClass[]):Program[]{const groups=new Map<string,SwimClass[]>();for(const item of classes)groups.set(item.program,[...(groups.get(item.program)??[]),item]);return[...groups].map(([name,items])=>{const min=Math.min(...items.map(x=>x.minimumAge)),max=Math.max(...items.map(x=>x.maximumAge)),places=items.reduce((sum,x)=>sum+Math.max(0,x.capacity-x.enrolled),0);return{name,ages:`${min}–${max} years`,format:`${Math.min(...items.map(x=>x.durationMinutes))} min · Small group`,availability:places?`${places} places`:'Waitlist',description:`Supportive ${name.toLowerCase()} coaching focused on safety, confidence, and steady progress.`,image:images[name]??images['Water Confidence']!}})}
function store(value:Session):Session{localStorage.setItem(SESSION_KEY,JSON.stringify(value));return value}

export const api:ApiClient={
	health:()=>request('health'),listClasses:async()=>(await request<{classes:SwimClass[]}>('classes')).classes,createEnrollment:async input=>(await request<{enrollment:Enrollment}>('enrollments','POST',input)).enrollment,getDashboard:()=>request<{metrics:DashboardMetric[];upcomingClasses:SwimClass[]}>('dashboard'),
	saveClass:async input=>(await request<{class:SwimClass}>('classes','POST',{class:input})).class,saveStudent:async input=>(await request<{student:Student}>('students','POST',{student:input})).student,recordAttendance:async input=>(await request<{attendance:{id:string}}>('attendance','POST',input)).attendance,
	listMessageTemplates:async()=>(await request<{templates:MessageTemplate[]}>('messageTemplates')).templates,saveMessageTemplate:async input=>(await request<{template:MessageTemplate}>('messageTemplates','POST',{template:input})).template,createWhatsAppLink:input=>request('whatsappLink','POST',input),
	listPrograms:async()=>programs(await api.listClasses()),listStudents:async()=>(await request<{students:Student[]}>('students')).students,getCurrentUser:async()=>(await request<{user:PublicUser}>('me')).user,
	login:async input=>store((await request<{session:Session}>('login','POST',input)).session),createAccount:async input=>store((await request<{session:Session}>('register','POST',input)).session),logout:async()=>{try{await request('logout','POST')}finally{localStorage.removeItem(SESSION_KEY)}},
};
export type { ApiClient } from './types';
