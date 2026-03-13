
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yahacllvgudcngeowsap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGFjbGx2Z3VkY25nZW93c2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTA3NzQsImV4cCI6MjA4NzAyNjc3NH0.H-vgqcVbou9RVCiH250YMCXYCEh-K9RtzKYwywXxinQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEngineers() {
    const { data, error } = await supabase.from('engineers').select('*').limit(1)
    if (error) {
        console.log(`Table 'engineers': ERROR - ${error.message}`)
    } else {
        console.log(`Table 'engineers': SUCCESS`)
    }
}

checkEngineers()
