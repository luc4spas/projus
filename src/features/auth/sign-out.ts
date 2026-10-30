import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Encerra a sessão limpando dados em cache antes de sair. */
export async function signOut(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
