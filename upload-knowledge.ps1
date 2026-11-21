$folder = "$env:USERPROFILE\Desktop\TBCare-PDF"
$url = "http://localhost:5000/api/knowledge/upload"

# Ambil semua PDF
$files = @(Get-ChildItem -LiteralPath $folder -Filter "*.pdf" -File |
    Where-Object {
        $_.Name -in @(
            "ref-4 tbc.pdf"
        )
    })

if ($files.Count -eq 0) {
    Write-Host "PDF tidak ditemukan!" -ForegroundColor Red
    exit
}

if ($files.Count -gt 10) {
    Write-Host "Maksimal 10 PDF dalam satu upload." -ForegroundColor Red
    exit
}

Write-Host "Ditemukan $($files.Count) PDF." -ForegroundColor Green

# Ambil token dari clipboard
$token = $env:TBCareToken

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token kosong. Upload dibatalkan." -ForegroundColor Red
    exit
}

if ($token.Split(".").Count -ne 3) {
    Write-Host "Format JWT tidak valid." -ForegroundColor Red
    exit
}

Write-Host "Token terbaca: $($token.Length) karakter." -ForegroundColor Green

# Siapkan request
$argsCurl = @(
    $url,
    "-H", "Authorization: Bearer $token",
    "-F", "author=Admin TBCare",
    "-F", "category=jurnal"
)

foreach ($file in $files) {
    $argsCurl += @(
        "-F", "files=@$($file.FullName);type=application/pdf"
    )
}

# Kirim request
& curl.exe -sS -i @argsCurl

# Bersihkan token dari variabel
$token = $null