// TEMPORARY test data
export const VIDEO_CATS = [
  {
    "id": "start",
    "en": "Getting started",
    "tr": "Başlangıç"
  },
  {
    "id": "traffic",
    "en": "Traffic & routing",
    "tr": "Trafik ve yönlendirme"
  },
  {
    "id": "tls",
    "en": "TLS & certificates",
    "tr": "TLS ve sertifikalar"
  },
  {
    "id": "resilience",
    "en": "Resilience",
    "tr": "Dayanıklılık"
  },
  {
    "id": "filters",
    "en": "Filters & access control",
    "tr": "Filtreler ve erişim kontrolü"
  },
  {
    "id": "shield",
    "en": "Elchi Shield",
    "tr": "Elchi Shield"
  },
  {
    "id": "observe",
    "en": "API Discovery & observability",
    "tr": "API Discovery ve gözlemlenebilirlik"
  },
  {
    "id": "ops",
    "en": "Operations & infrastructure",
    "tr": "Operasyon ve altyapı"
  }
];
export const VIDEOS = [
  {
    "slug": "explainer",
    "yt": "-HT-WSd2hJg",
    "cat": "start",
    "title": "Elchi: Traffic Management & API Security",
    "en": "Elchi is the ambassador between your users and your services.",
    "tr": "Elchi, kullanıcılarınızla servisleriniz arasındaki elçidir.",
    "duration": "2:43",
    "seconds": 163,
    "date": "2026-11-05"
  },
  {
    "slug": "access-log-custom",
    "yt": "bLo-tBQ9VWg",
    "cat": "observe",
    "title": "Build Your Own Access Log — Headers and Key Operators",
    "en": "Decide what your access log records: start from the Standard preset, use the built-in Operators help, add request and response headers with REQ and RESP, attach the log to a running service and find the new fields in Logs.",
    "tr": "Erişim logunuzun neyi kaydedeceğine karar verin: Standard ön ayarıyla başlayın, yerleşik Operators yardımını kullanın, REQ ve RESP ile istek ve yanıt başlıkları ekleyin, logu çalışan bir servise bağlayın ve yeni alanları Logs’ta bulun.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "access-logs",
    "yt": "G1zoCk8U1oA",
    "cat": "observe",
    "title": "Access Logs — See Every Request",
    "en": "Turn on access logs for a running service in one click and read them right in Elchi: follow the live tail, filter client and server errors, and open a single request to see its path, status, timing, upstream and flags.",
    "tr": "Çalışan bir servis için access log'ları tek tıkla açın ve doğrudan Elchi'de okuyun: canlı akışı izleyin, istemci ve sunucu hatalarını filtreleyin, tek bir isteği açıp yolunu, durumunu, süresini, upstream'ini ve bayraklarını görün.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "adaptive-concurrency",
    "yt": "Gqo1N7sRO-M",
    "cat": "resilience",
    "title": "Adaptive Concurrency — Protect a Slow Backend",
    "en": "Let Elchi find how many requests a backend can handle at once: the adaptive concurrency HTTP filter measures response times, lowers the concurrency limit when the backend slows down and refuses the excess right away — published live on a running service.",
    "tr": "Elchi’nin bir backend’in aynı anda kaç isteği kaldırabileceğini bulmasını sağlayın: adaptive concurrency HTTP filtresi yanıt sürelerini ölçer, backend yavaşlayınca eşzamanlılık limitini düşürür ve fazlasını hemen reddeder — çalışan bir serviste canlıya alınır.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "admission-control",
    "yt": "-V1rWg7oAAA",
    "cat": "resilience",
    "title": "Admission Control — Shed Load When the Backend Fails",
    "en": "When a backend starts failing, the admission control HTTP filter watches the success rate and refuses part of the traffic before it reaches the backend, then lets it back in as soon as the backend recovers — published live on a running service.",
    "tr": "Bir backend hata vermeye başladığında admission control HTTP filtresi başarı oranını izler, trafiğin bir kısmını backend’e ulaşmadan reddeder ve backend toparlanır toparlanmaz yeniden içeri alır — çalışan bir serviste canlıya alınır.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "ai-analyzer",
    "yt": "z4CRk1hoVbA",
    "cat": "observe",
    "title": "AI Analyzer — Ask Questions About Your Configuration",
    "en": "Ask the AI Analyzer about a listener: it reads the real configuration and everything it depends on, and answers with its analysis and suggestions — certificates and secrets never leave Elchi. Then let it read a Logs page: it summarises the errors and finds the root cause. Bring your own OpenRouter key and pick a model in Settings → AI.",
    "tr": "AI Analyzer'a bir listener hakkında soru sorun: gerçek yapılandırmayı ve bağlı olduğu her şeyi okur, analiz ve önerilerle cevap verir — sertifikalar ve secret'lar Elchi'den çıkmaz. Sonra bir Logs sayfasını okutun: hataları özetler ve kök nedeni bulur. Kendi OpenRouter anahtarınızı getirip Settings → AI'da modeli seçersiniz.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "api-discovery",
    "yt": "tvd1SoPnUW4",
    "cat": "observe",
    "title": "Discover Your APIs Automatically",
    "en": "Turn on API Discovery for a running service with one switch and let Elchi build the API inventory from live traffic: methods and paths, templated IDs, query parameters, status codes and exposure — no OpenAPI spec needed.",
    "tr": "Çalışan bir servis için API Discovery’yi tek bir anahtarla açın ve Elchi’nin canlı trafikten API envanterini çıkarmasını izleyin: metotlar ve yollar, şablonlanmış ID’ler, sorgu parametreleri, durum kodları ve erişim durumu — OpenAPI tanımı gerekmez.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "api-discovery-deep",
    "yt": "uHXTI5q_VdY",
    "cat": "observe",
    "title": "API Discovery in Depth — Findings, Risks and Coverage",
    "en": "Go beyond the endpoint list: API Discovery turns live traffic into findings — new APIs, authentication coverage, risks and a security score, transport, errors and drift — with per-endpoint events and analytics, a risk guide, and an OpenAPI file to export. IP Geolocation by DB-IP.",
    "tr": "Endpoint listesinin ötesine geçin: API Discovery canlı trafiği bulgulara dönüştürür — yeni API’ler, kimlik doğrulama kapsamı, riskler ve güvenlik puanı, taşıma, hatalar ve sapma — endpoint bazında olaylar ve analizler, bir risk rehberi ve dışa aktarılabilir bir OpenAPI dosyasıyla. IP Geolocation by DB-IP.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "basic-auth",
    "yt": "U82nhblLjoY",
    "cat": "filters",
    "title": "Protect a Service with Basic Auth",
    "en": "Put a username and password in front of a running service with the Basic Auth HTTP filter: create the user with the built-in hash generator, add the filter to the service and publish it live — no change to the backend.",
    "tr": "Çalışan bir servisin önüne Basic Auth HTTP filtresiyle kullanıcı adı ve şifre koyun: kullanıcıyı yerleşik hash üreteciyle oluşturun, filtreyi servise ekleyip canlıya alın — backend'de değişiklik yok.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "bgp-vip",
    "yt": "d0uijGRY0UM",
    "cat": "ops",
    "title": "Advertise Service Addresses with BGP",
    "en": "Configure BGP on an Elchi OS client straight from the Elchi UI: an AS number and router ID, one neighbor, and every service address is advertised to your router as a /32 route. Stop a service and its route is withdrawn within seconds; start it again and the route is back.",
    "tr": "Bir Elchi OS client'ında BGP'yi doğrudan Elchi arayüzünden yapılandırın: bir AS numarası ve router ID, tek bir komşu — ve her servis adresi router'ınıza /32 rotası olarak duyurulur. Bir servisi durdurun, rotası saniyeler içinde geri çekilir; yeniden başlatın, rota geri gelir.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "blue-green-switch",
    "yt": "rIQGsHndVuE",
    "cat": "traffic",
    "title": "Blue/Green Release with Cluster Endpoints",
    "en": "Release a new version with a blue/green switch: Cluster Endpoints points a running cluster from its blue backends to its green ones in one step. Preview the change, switch it live without a redeploy, and keep a history of every switch.",
    "tr": "Yeni bir sürümü blue/green geçişle yayına alın: Cluster Endpoints çalışan bir cluster'ı tek adımda blue backend'lerinden green olanlara çevirir. Değişikliği önizleyin, yeniden deploy etmeden canlıya alın ve her geçişin geçmişini tutun.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "http-service-step-by-step",
    "yt": "bRHczTQG9hc",
    "cat": "start",
    "title": "Build a Load-Balanced HTTP Service Step by Step",
    "en": "Build an HTTP service by hand: an endpoint resource with three backends, an EDS cluster with round robin, an HTTP connection manager and a listener. Deploy it to an Elchi client and watch every reload land on another backend.",
    "tr": "Bir HTTP servisini elle kurun: üç backend'li bir endpoint kaynağı, round robin ile bir EDS cluster, bir HTTP connection manager ve bir listener. Servisi bir Elchi client'ına deploy edin ve her yenilemenin başka bir backend'e gittiğini görün.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  },
  {
    "slug": "https-lets-encrypt",
    "yt": "sPUwznEl2fk",
    "cat": "tls",
    "title": "Serve HTTPS with a Let's Encrypt Certificate",
    "en": "Request a free Let's Encrypt certificate right in Elchi, validated through DNS, create a TLS context that serves it and add an HTTPS port to a running service. The change goes live on the Elchi client without a redeploy, and Elchi renews the certificate before it expires.",
    "tr": "Elchi içinden, DNS ile doğrulanan ücretsiz bir Let's Encrypt sertifikası alın, onu sunan bir TLS context oluşturun ve çalışan bir servise HTTPS portu ekleyin. Değişiklik Elchi client'ında yeniden deploy olmadan canlıya alınır; sertifikayı da süresi dolmadan Elchi yeniler.",
    "duration": "1:49",
    "seconds": 109,
    "date": "2026-11-05"
  }
];
