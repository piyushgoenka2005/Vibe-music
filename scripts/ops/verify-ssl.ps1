# Probe vibemusic.in TLS from your PC (detects duplicate-IP / wrong-cert issues).
param(
    [string]$HostName = "vibemusic.in",
    [string]$Ip = "31.42.125.219",
    [int]$Port = 443,
    [int]$Attempts = 20
)

$ok = 0
$bad = 0
$errors = @{}

for ($i = 1; $i -le $Attempts; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient($Ip, $Port)
        $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({ $true }))
        $ssl.AuthenticateAsClient($HostName)
        $subject = $ssl.RemoteCertificate.Subject
        $ssl.Close()
        $tcp.Close()
        if ($subject -match "CN=$HostName" -or $subject -match "CN=www\.$HostName") {
            $ok++
        } else {
            $bad++
            $errors[$subject] = ($errors[$subject] ?? 0) + 1
        }
    } catch {
        $bad++
        $msg = $_.Exception.Message
        $errors[$msg] = ($errors[$msg] ?? 0) + 1
    }
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "TLS probe: $HostName @ ${Ip}:${Port} ($Attempts attempts)"
Write-Host "  OK:   $ok"
Write-Host "  FAIL: $bad"

if ($bad -gt 0) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Yellow
    $errors.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Value)x $($_.Key)" }
    Write-Host ""
    Write-Host "If failures mention wrong CN or trust errors, CloudOnFire has two VMs on $Ip." -ForegroundColor Red
    Write-Host "Open a support ticket (see docs/ops/IP-MIGRATION-GODADDY.md section I)." -ForegroundColor Red
    exit 1
}

Write-Host "All probes returned a valid certificate for $HostName." -ForegroundColor Green
exit 0
