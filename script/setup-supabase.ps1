# Supabase Setup Script
# هذا السكريبت يساعدك في إعداد Supabase CLI وربط المشروع

Write-Host "🚀 إعداد Supabase..." -ForegroundColor Cyan

# 1. التحقق من Supabase CLI
Write-Host "`n1️⃣ التحقق من Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = npx supabase --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase CLI متاح: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase CLI غير متاح" -ForegroundColor Red
    Write-Host "جارٍ التثبيت..." -ForegroundColor Yellow
    npm install supabase --save-dev
}

# 2. Project Reference ID
$projectRef = "tywwcinmoncjkitzqfaa"
Write-Host "`n2️⃣ Project Reference ID: $projectRef" -ForegroundColor Yellow

# 3. تحديث ملف .env
Write-Host "`n3️⃣ تحديث ملف .env..." -ForegroundColor Yellow
$envFile = ".env"
$envContent = @"
PAYLINK_APP_ID=APP_ID_1764821701792
PAYLINK_SECRET_KEY=0a48bb80-dafc-3ffe-a459-6a5e5069b0b3
PAYLINK_BASE_URL=https://restapi.paylink.sa/api

DATABASE_URL=postgresql://postgres:0595337080Kk.@db.tywwcinmoncjkitzqfaa.supabase.co:5432/postgres

NODE_ENV=development

# Supabase Configuration
VITE_SUPABASE_URL=https://tywwcinmoncjkitzqfaa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN

# Enable Supabase Edge Functions
VITE_USE_SUPABASE_EDGE_FUNCTIONS=true

# Authentica SMS API Key (اختياري)
# AUTHENTICA_API_KEY=your_api_key_here
"@

Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Write-Host "✅ تم تحديث ملف .env" -ForegroundColor Green

# 4. تعليمات الربط
Write-Host "`n4️⃣ تعليمات الربط:" -ForegroundColor Yellow
Write-Host "   قم بتسجيل الدخول أولاً:" -ForegroundColor White
Write-Host "   npx supabase login" -ForegroundColor Cyan
Write-Host "`n   ثم اربط المشروع:" -ForegroundColor White
Write-Host "   npx supabase link --project-ref $projectRef" -ForegroundColor Cyan

Write-Host "`n✅ تم إعداد Supabase!" -ForegroundColor Green
Write-Host "`nالخطوات التالية:" -ForegroundColor Yellow
Write-Host "   1. npx supabase login" -ForegroundColor Cyan
Write-Host "   2. npx supabase link --project-ref $projectRef" -ForegroundColor Cyan
Write-Host "   3. npm run supabase:db:push" -ForegroundColor Cyan
Write-Host "   4. npm run supabase:functions:deploy" -ForegroundColor Cyan










