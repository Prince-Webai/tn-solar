
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGFjbGx2Z3VkY25nZW93c2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTA3NzQsImV4cCI6MjA4NzAyNjc3NH0.H-vgqcVbou9RVCiH250YMCXYCEh-K9RtzKYwywXxinQ'
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
console.log(payload)
