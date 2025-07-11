import { supabase } from '@/lib/supabase/client';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getFAQs(): Promise<{ faqs: FAQ[] | null; error: any }> {
  try {
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return { faqs: null, error };
    }

    return { faqs, error: null };
  } catch (error) {
    console.error('Error in getFAQs:', error);
    return { faqs: null, error };
  }
}

export async function getFAQById(id: string): Promise<{ faq: FAQ | null; error: any }> {
  try {
    const { data: faq, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching FAQ by ID:', error);
      return { faq: null, error };
    }

    return { faq, error: null };
  } catch (error) {
    console.error('Error in getFAQById:', error);
    return { faq: null, error };
  }
} 