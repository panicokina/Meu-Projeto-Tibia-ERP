import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Configura o cliente do Supabase usando as variáveis de ambiente do projeto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    // Faz uma leitura rápida na tabela principal para gerar atividade no banco
    const { error } = await supabase
      .from("tibia_dashboard")
      .select("id")
      .eq("id", "main")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Supabase and Vercel are alive!", 
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}