"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { salesFetch } from "@/components/sales/client-api";
export function GalleryCategoryForm() { const [name,setName]=useState(""); const [error,setError]=useState(""); const router=useRouter(); return <form className="mt-8 flex max-w-xl gap-3" onSubmit={async e=>{e.preventDefault();setError("");try{await salesFetch("/api/gallery/categories","POST",{name,slug:"",description:"",isActive:true,sortOrder:0});setName("");router.refresh();}catch(x){setError(x instanceof Error?x.message:"Unable to save category");}}}><input name="name" value={name} onChange={e=>setName(e.target.value)} required placeholder="Category name" className="flex-1 rounded-lg border px-3 py-2" /><button className="rounded-lg bg-primary px-4 py-2 font-bold">Add category</button>{error&&<span className="text-sm text-red-700">{error}</span>}</form>; }
