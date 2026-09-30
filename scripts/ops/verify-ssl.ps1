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
        $ssl = New-Object System.Net.Security.SslStream(
            $tcp.GetStream(),
            $false,
            {
                param($sender, $cert, $chain, $errors)
                return $errors -eq [System.Net.Security.SslPolicyErrors]::None
            }
        )
        $ssl.AuthenticateAsClient($HostName)
        $subject = $ssl.RemoteCertificate.Subject
        $ssl.Close()
        $tcp.Close()
        if ($subject -match "CN=$HostName" -or $subject -match "CN=www\.$HostName") {
            $ok++
        } else {
            $bad++
            if (-not $errors.ContainsKey($subject)) { $errors[$subject] = 0 }
            $errors[$subject]++
        }
    } catch {
        $bad++
        $msg = $_.Exception.Message
        if (-not $errors.ContainsKey($msg)) { $errors[$msg] = 0 }
        $errors[$msg]++
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
    foreach ($entry in $errors.GetEnumerator()) {
        Write-Host "  $($entry.Value)x $($entry.Key)"
    }
    Write-Host ""
    Write-Host "Wrong certificate = CloudOnFire routes traffic to another VM (often CN=git.k12hunar.com)." -ForegroundColor Red
    Write-Host "Fix: CloudOnFire support ticket - docs/ops/cloudonfire-duplicate-ip-ticket.txt" -ForegroundColor Yellow
    Write-Host "Then update GoDaddy A records to the new dedicated IP they assign." -ForegroundColor Yellow
    exit 1
}

Write-Host "All probes returned a valid certificate for $HostName." -ForegroundColor Green
exit 0
