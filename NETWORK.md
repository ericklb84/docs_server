# Acesso na rede (celular / outro PC)

Se ao abrir `http://192.168.x.x:5173` em outro dispositivo aparecer **ERR_CONNECTION_REFUSED**, confira:

## 1. Reiniciar o ambiente de dev

Depois de alterar `vite.config.ts` ou o servidor, pare tudo (Ctrl+C) e suba de novo:

```bash
npm run dev
```

No terminal do **client** (Vite) deve aparecer algo como:

- `Local:   http://localhost:5173/`
- `Network: http://192.168.1.6:5173/`

Se não aparecer a linha "Network", o Vite não está escutando na rede.

## 2. Testar no próprio Mac

No próprio Mac, abra no navegador: **http://192.168.1.6:5173** (use o IP que apareceu em "Network").

- **Se abrir**: o Vite está ok; o problema é rede ou firewall no celular/outro PC.
- **Se der REFUSED**: algo ainda está impedindo o Vite de escutar em `0.0.0.0` (antivírus, outra ferramenta, etc.).

## 3. Firewall do macOS

O firewall pode bloquear conexões de entrada na porta 5173:

1. **Ajustes do Sistema** → **Rede** → **Firewall** (ou **Segurança e Privacidade** → **Firewall**).
2. Se o firewall estiver ligado, clique em **Opções**.
3. Verifique se **Node** ou **Terminal** (ou o processo que roda o Vite) está com permissão para **Aceitar conexões de entrada**.
4. Ou, para testar, desative o firewall temporariamente e tente de novo no celular.

## 4. Mesma rede Wi‑Fi

Celular e Mac precisam estar na **mesma rede** (mesmo Wi‑Fi). Em rede de convidado ou outro SSID, o 192.168.x.x do Mac pode não ser acessível.

## 5. Porta 5173 liberada

Se usar outro firewall ou roteador que filtra portas, garanta que a **5173** está liberada para acesso na LAN.
