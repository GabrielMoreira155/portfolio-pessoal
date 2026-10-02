/*
  Fundo animado da hero (Three.js r160).
  Portado do design system Pulsedesk: trilhas de luz correndo sobre um piso
  que se curva em parede, com bloom e desfoque no primeiro plano.

  RODA NUM WORKER (OffscreenCanvas): carregar o Three.js, criar o WebGL e
  desenhar cada quadro acontecem numa thread separada. A thread principal da
  página fica livre para rolagem, cliques e animações de entrada, então a
  animação não trava mais a página. Se o navegador não suportar worker com
  WebGL, o mesmo "motor" roda na própria página (como antes).

  Para funcionar abrindo o arquivo direto do disco (file:///), onde o Chrome
  bloqueia workers de arquivo e módulos locais: o worker é criado a partir do
  próprio código (Blob) e o Three.js vem do endpoint "+esm" do jsDelivr, que já
  resolve as dependências sem precisar de importmap.

  Otimizações (sem mudar o visual nem o movimento):
  - as 100 trilhas são instâncias de UM tubo base (2 desenhos por quadro)
  - shaders compilados em paralelo (compileAsync) e cada efeito "aquecido" num
    quadro separado antes da animação aparecer
  - resolução interna limitada a ~700 mil pixels (em 1920x1080, ~68%): sem
    isso a placa integrada saturava e o Chrome inteiro engasgava
  - 30 quadros por segundo; FXAA no lugar do SMAA (MSAA ficou MAIS lento na
    Intel UHD, não usar); bloom a 70%; desfoque com 12 amostras
  Pausa quando a hero sai da tela ou a aba fica oculta.
*/
(function () {
'use strict';
const canvas = document.querySelector('#hero-canvas');
if (!canvas) return;

// =====================================================================
// MOTOR DA ANIMAÇÃO
// Autocontido (não usa nada de fora): é convertido em texto para virar o
// worker. Conversa com a página por mensagens:
//   página -> motor: iniciar {canvas, largura, altura, dpr, celular, reduzir}
//                    tamanho {largura, altura} | rodar {valor}
//   motor -> página: pronto (1º quadro desenhado) | falhou {erro}
//   (no worker, antes de tudo: página -> testar; motor -> suporte {ok})
// =====================================================================
function motor(porta) {
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
  const raf = typeof requestAnimationFrame === 'function'
    ? (f) => requestAnimationFrame(f)
    : (f) => setTimeout(() => f(performance.now()), 16);
  // devolve o controle entre etapas (evita uma tarefa longa só)
  const proximoQuadro = () => new Promise((ok) => raf(() => setTimeout(ok, 0)));

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, ShaderPass, OutputPass, FXAAShader, CycCurve;
  let canvas, largura = 1, altura = 1, reduzir = false, config;
  let scene, camera, renderer, composer, blurPass, floorMesh, fxaaPass, outputPass, trailMesh, trailRefMesh;
  let clock, globalTime = 0, running = false, rafId = null, pronto = false, avisouPronto = false;
  const trailObjects = [];
  const trailMaterials = [];

  async function carregarThree() {
    [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }, { FXAAShader }] =
      await Promise.all([
        import(CDN + '+esm'),
        import(CDN + 'examples/jsm/postprocessing/EffectComposer.js/+esm'),
        import(CDN + 'examples/jsm/postprocessing/RenderPass.js/+esm'),
        import(CDN + 'examples/jsm/postprocessing/UnrealBloomPass.js/+esm'),
        import(CDN + 'examples/jsm/postprocessing/ShaderPass.js/+esm'),
        import(CDN + 'examples/jsm/postprocessing/OutputPass.js/+esm'),
        import(CDN + 'examples/jsm/shaders/FXAAShader.js/+esm'),
      ]);

    CycCurve = class extends THREE.Curve {
      constructor(x, zStart, zBend, radius, yEnd) {
        super();
        this.x = x;
        this.zStart = zStart;
        this.zBend = zBend;
        this.radius = radius;
        this.yEnd = yEnd;
        this.L_flat = Math.abs(zStart - (zBend + radius));
        this.L_arc = Math.PI * radius * 0.5;
        this.L_up = Math.max(0.1, yEnd - radius);
        this.totalLength = this.L_flat + this.L_arc + this.L_up;
      }
      getPoint(t, target = new THREE.Vector3()) {
        const d = t * this.totalLength;
        let py = 0, pz = 0;
        if (d <= this.L_flat) {
          pz = this.zStart - d;
        } else if (d <= this.L_flat + this.L_arc) {
          const n = (d - this.L_flat) / this.L_arc;
          const eased = n * n * (3.0 - 2.0 * n);
          const angle = (n * 0.4 + eased * 0.6) * (Math.PI * 0.5);
          py = this.radius * (1.0 - Math.cos(angle));
          pz = this.zBend + this.radius - Math.sin(angle) * this.radius;
        } else {
          py = this.radius + (d - (this.L_flat + this.L_arc));
          pz = this.zBend;
        }
        return target.set(this.x, py, pz);
      }
    };
  }

  function criarConfig(dpr, celular) {
    return {
      // Orçamento de pixels por quadro: a animação é desenhada com no máximo
      // ~700 mil pixels e ampliada na tela. Em 1920x1080 isso dá ~68% da
      // resolução; sem esse limite a animação saturava a placa de vídeo
      // integrada (Intel UHD) e o Chrome INTEIRO caía para ~20 telas/s, com
      // engasgos de até 0,3 s (medido). Como a cena é feita de brilho e
      // desfoque, a diferença visual é mínima.
      orcamentoPixels: 700000,
      // limite superior: celular (faixa pequena) até 1,5x; desktop até 1x
      dprMax: celular ? Math.min(dpr, 1.5) : 1,
      dpr: 1,
      fps: 30,
      exposure: 3.6505,
      bloomStrength: 0.2025,
      bloomRadius: 0.294,
      bloomThreshold: 0.0,
      speedMultiplier: 0.1,
      linesCount: celular ? 50 : 100,
      dotDensity: 70,
      dotSize: 0.25,
      dotSpeed: 1.5,
      blurStrength: 3.5,
      arcRadius: 10.0,
      bendStartZ: -150.0,
      floorLength: 132.75,
      wallHeight: 200.0,
      brightness: 4.0131,
      // ATENÇÃO: imagens/hero-poster.webp é um quadro desta animação (capa que
      // aparece enquanto ela carrega). Se mudar cores, câmera ou parâmetros aqui,
      // gere uma capa nova para a troca continuar sem "pulo".
      // Trilhas em preto e branco (tons de cinza com o mesmo brilho das originais).
      // Cores originais do Pulsedesk (azul-ciano):
      // ['#080c14', '#0ea5e9', '#22d3ee', '#ffffff', '#0b1220']
      colors: ['#0a0a0a', '#8c8c8c', '#bfbfbf', '#ffffff', '#141414'],
    };
  }

  async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(55, largura / altura, 1, 2000);
    camera.position.set(0, 20, 140);
    camera.lookAt(0, 20, -50);

    // antialias do canvas não ajuda: a cena é desenhada no renderTarget abaixo
    // 'default': em notebook com duas placas, pedir 'high-performance' força a
    // troca para a placa dedicada, o que atrasa a abertura
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'default' });
    renderer.setSize(largura, altura, false);
    renderer.setPixelRatio(config.dpr);
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = config.exposure;
    await proximoQuadro();

    const renderTarget = new THREE.WebGLRenderTarget(largura * config.dpr, altura * config.dpr, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
    });

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(largura * 0.7, altura * 0.7),
      config.bloomStrength, config.bloomRadius, config.bloomThreshold
    );
    // Bloom a 70% da resolução: quase o dobro de quadros por segundo em placa
    // integrada, sem diferença visível (menos que isso começa a pixelar o brilho)
    const bloomSetSize = bloomPass.setSize.bind(bloomPass);
    bloomPass.setSize = (w, h) => bloomSetSize(Math.max(1, Math.round(w * 0.7)), Math.max(1, Math.round(h * 0.7)));

    blurPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(largura * config.dpr, altura * config.dpr) },
        blurStrength: { value: config.blurStrength },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float blurStrength;
        varying vec2 vUv;
        void main() {
          float mask = 1.0 - smoothstep(0.0, 0.35, vUv.y);
          float radius = mask * blurStrength;
          if (radius < 0.1) {
            gl_FragColor = texture2D(tDiffuse, vUv);
          } else {
            vec4 color = vec4(0.0);
            float total = 0.0;
            const float GA = 2.3999632;
            // 12 amostras (eram 32); raio ajustado para manter o mesmo alcance
            for (int i = 0; i < 12; i++) {
              float f = float(i);
              float r = sqrt(f) * radius * 1.68;
              float theta = f * GA;
              vec2 offset = vec2(cos(theta), sin(theta)) * (r / resolution);
              color += texture2D(tDiffuse, vUv + offset);
              total += 1.0;
            }
            gl_FragColor = color / total;
          }
        }
      `,
    });

    composer = new EffectComposer(renderer, renderTarget);
    composer.setPixelRatio(config.dpr);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
    composer.addPass(blurPass);
    fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms.resolution.value.set(1 / (largura * config.dpr), 1 / (altura * config.dpr));
    composer.addPass(fxaaPass);
    outputPass = new OutputPass();
    composer.addPass(outputPass);
    await proximoQuadro();

    createFloor();
    generateTrails();
    updateGeometries();
    await proximoQuadro();
    await aquecerShaders();
    await aquecerPasses();
  }

  // Compila todos os shaders antes do 1º quadro, em paralelo, no mesmo
  // "estado" em que serão usados: cena e efeitos desenham em imagens
  // intermediárias; só o OutputPass desenha no canvas.
  async function aquecerShaders() {
    // Sem compilação em paralelo no aparelho, não há ganho: compila no 1º quadro
    if (!renderer.extensions.has('KHR_parallel_shader_compile')) return;
    renderer.setRenderTarget(composer.renderTarget1);
    await renderer.compileAsync(scene, camera);

    const extras = new THREE.Scene();
    const quad = new THREE.PlaneGeometry(2, 2);
    const vistos = new Set();
    const adicionar = (m) => {
      if (!m || !m.isMaterial || vistos.has(m)) return;
      vistos.add(m);
      const mesh = new THREE.Mesh(quad, m);
      mesh.frustumCulled = false;
      extras.add(mesh);
    };
    composer.passes.forEach((pass) => {
      if (pass === outputPass) return;
      Object.values(pass).forEach((v) => [].concat(v).forEach(adicionar));
    });
    adicionar(composer.copyPass && composer.copyPass.material);
    await renderer.compileAsync(extras, camera);

    // OutputPass: monta os mesmos "defines" que ele montaria no 1º quadro
    outputPass._outputColorSpace = renderer.outputColorSpace;
    outputPass._toneMapping = renderer.toneMapping;
    outputPass.material.defines = {};
    if (THREE.ColorManagement.getTransfer(renderer.outputColorSpace) === THREE.SRGBTransfer) outputPass.material.defines.SRGB_TRANSFER = '';
    if (renderer.toneMapping === THREE.LinearToneMapping) outputPass.material.defines.LINEAR_TONE_MAPPING = '';
    outputPass.material.needsUpdate = true;
    const saida = new THREE.Scene();
    const meshSaida = new THREE.Mesh(quad, outputPass.material);
    meshSaida.frustumCulled = false;
    saida.add(meshSaida);
    renderer.setRenderTarget(null);
    await renderer.compileAsync(saida, camera);
    quad.dispose();
  }

  // O 1º desenho completo é caro porque a placa de vídeo cria de uma vez todas
  // as imagens intermediárias dos efeitos. Cada efeito desenha uma vez, em
  // quadros separados, enquanto o canvas ainda está invisível (atrás da capa).
  async function aquecerPasses() {
    const leitura = composer.renderTarget1;
    const escrita = composer.renderTarget2;
    for (const pass of composer.passes) {
      pass.render(renderer, escrita, leitura, 0, false);
      await proximoQuadro();
    }
  }

  function createFloor() {
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
    floorMesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    floorMesh.position.set(0, -0.5, -0.5);
    floorMesh.renderOrder = 1;
    scene.add(floorMesh);
  }

  function generateTrails() {
    // Cada trilha guarda seus valores próprios (posição, espessura, cor,
    // velocidade, deslocamento, cauda) em atributos de instância.
    const vertexShader = `
      attribute vec2 aPos;   // x = posição lateral, y = espessura (raio) da trilha
      attribute vec3 aColor;
      attribute vec3 aTrail; // x = velocidade, y = deslocamento, z = cauda
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vColor;
      varying vec3 vTrail;
      void main() {
        vUv = uv;
        vColor = aColor;
        vTrail = aTrail;
        // tubo base tem raio 1 e está em x = 0: volta ao eixo da curva e
        // reaplica a espessura e a posição lateral desta trilha
        vec3 eixo = position - normal;
        vec3 pos = eixo + normal * aPos.y + vec3(aPos.x, 0.0, 0.0);
        vNormal = normalMatrix * normal;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vColor;
      varying vec3 vTrail;
      uniform float uTime;
      uniform float uIntensityMultiplier;
      uniform float uBendUv;
      uniform float uIsReflection;
      uniform float uDotDensity;
      uniform float uDotSize;
      uniform float uDotSpeed;
      uniform float uBrightness;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vec3 uColor = vColor;
        float uSpeed = vTrail.x;
        float uOffset = vTrail.y;
        float uTailLength = vTrail.z;
        float t = fract(uTime * uSpeed + uOffset);
        float dist = fract(t - vUv.x + 1.0);
        float baseAlpha = smoothstep(uTailLength, 0.0, dist);
        baseAlpha = pow(max(0.0, baseAlpha), 1.2);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = abs(dot(normalize(vNormal), viewDir));
        baseAlpha *= smoothstep(0.0, 0.02, fresnel);
        float core = pow(max(0.0, baseAlpha), 3.0) * 1.5;
        float movingUV = vUv.x - (uTime * uSpeed * uDotSpeed) - uOffset;
        float signalPos = movingUV * uDotDensity;
        float dotId = floor(signalPos);
        float dotLocal = fract(signalPos);
        float distToCenter = length(vec2((dotLocal - 0.5) * 2.0, (fract(vUv.y + 0.5) - 0.5) * 6.0));
        float dotShape = 1.0 - smoothstep(0.0, max(0.001, uDotSize), distToCenter);
        float dotFinal = dotShape * step(0.6, hash(vec2(dotId, uOffset))) * (sin(uTime * 4.0 + hash(vec2(dotId)) * 6.28) * 0.3 + 0.7) * baseAlpha;
        if (uIsReflection > 0.5) {
          float refFade = 1.0 - smoothstep(uBendUv - 0.015, uBendUv, vUv.x);
          baseAlpha *= refFade;
          core *= refFade;
          dotFinal *= refFade * 0.1;
          baseAlpha = pow(max(0.0, baseAlpha), 0.5) * (0.7 + hash(vUv * 300.0 + uTime * 0.05) * 0.3);
          core *= 0.3;
        }
        vec3 trailColor = uColor * (baseAlpha + core * 1.5) * uIntensityMultiplier * uBrightness;
        vec3 rgb = trailColor / max(1.0 - clamp(dotFinal * 1.8, 0.0, 0.95), 0.001) + uColor * dotFinal * 2.5 * uIntensityMultiplier * uBrightness;
        gl_FragColor = vec4(rgb, (baseAlpha + dotFinal) * uIntensityMultiplier);
      }
    `;

    // Mesmos sorteios do original, na mesma ordem
    for (let i = 0; i < config.linesCount; i++) {
      const normIdx = (i / (config.linesCount - 1)) * 2 - 1;
      const expPos = Math.sign(normIdx) * Math.pow(Math.abs(normIdx), 1.2);
      let startX = (normIdx * 0.5 + expPos * 0.5) * 80;
      startX += (Math.random() - 0.5) * 2.0;
      const thickness = Math.random() * 0.2 + 0.1;
      const colorIdx = Math.floor(Math.random() * 5);
      const color = new THREE.Color(config.colors[colorIdx]);
      const speed = Math.random() * 0.5 + 0.2;
      const offset = Math.random();
      const tail = Math.random() * 0.4 + 0.3;
      trailObjects.push({ startX, thickness, color, speed, offset, tail });
    }

    const makeMaterial = (intensity, isReflection) => new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensityMultiplier: { value: intensity },
        uBendUv: { value: 0.0 },
        uIsReflection: { value: isReflection },
        uDotDensity: { value: config.dotDensity },
        uDotSize: { value: config.dotSize },
        uDotSpeed: { value: config.dotSpeed },
        uBrightness: { value: config.brightness },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const material = makeMaterial(1.0, 0.0);
    const refMaterial = makeMaterial(0.4, 1.0);

    const group = new THREE.Group();
    scene.add(group);
    trailMesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    trailRefMesh = new THREE.Mesh(new THREE.BufferGeometry(), refMaterial);
    trailRefMesh.scale.y = -1;
    trailRefMesh.position.y = -1.0;
    // as instâncias cobrem a cena toda; não vale a pena testar se estão na tela
    trailMesh.frustumCulled = trailRefMesh.frustumCulled = false;
    group.add(trailMesh, trailRefMesh);
    trailMaterials.push(material.uniforms, refMaterial.uniforms);
  }

  function updateGeometries() {
    // 400 divisões bastam para a curva (eram 1500)
    const floorGeo = new THREE.PlaneGeometry(1000, 1000, 1, 400);
    floorGeo.rotateX(-Math.PI * 0.5);
    const pos = floorGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 2] < config.bendStartZ) {
        const d = config.bendStartZ - pos[i + 2];
        const maxA = config.arcRadius * Math.PI * 0.5;
        if (d < maxA) {
          const n = d / maxA;
          const a = (n * 0.4 + n * n * (3.0 - 2.0 * n) * 0.6) * (Math.PI * 0.5);
          pos[i + 1] = config.arcRadius * (1.0 - Math.cos(a));
          pos[i + 2] = config.bendStartZ - Math.sin(a) * config.arcRadius;
        } else {
          pos[i + 1] = config.arcRadius + (d - maxA);
          pos[i + 2] = config.bendStartZ - config.arcRadius;
        }
      }
    }
    floorGeo.computeVertexNormals();
    floorMesh.geometry = floorGeo;

    const flat = Math.abs(config.floorLength - config.bendStartZ);
    const bendUv = flat / (flat + Math.PI * config.arcRadius * 0.5 + Math.max(0.1, config.wallHeight - config.arcRadius));
    // Um único tubo base (raio 1, em x = 0); as trilhas são instâncias dele
    const base = new CycCurve(0, config.floorLength, config.bendStartZ - config.arcRadius, config.arcRadius, config.wallHeight);
    const tubo = new THREE.TubeGeometry(base, 200, 1, 6, false);
    const geo = new THREE.InstancedBufferGeometry().copy(tubo);
    tubo.dispose();
    const n = trailObjects.length;
    const posTrilhas = new Float32Array(n * 2);
    const cores = new Float32Array(n * 3);
    const dados = new Float32Array(n * 3);
    trailObjects.forEach((obj, i) => {
      posTrilhas[i * 2] = obj.startX; posTrilhas[i * 2 + 1] = obj.thickness;
      cores[i * 3] = obj.color.r; cores[i * 3 + 1] = obj.color.g; cores[i * 3 + 2] = obj.color.b;
      dados[i * 3] = obj.speed; dados[i * 3 + 1] = obj.offset; dados[i * 3 + 2] = obj.tail;
    });
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(posTrilhas, 2));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(cores, 3));
    geo.setAttribute('aTrail', new THREE.InstancedBufferAttribute(dados, 3));
    geo.instanceCount = n;
    trailMesh.geometry = trailRefMesh.geometry = geo;
    trailMaterials.forEach((u) => (u.uBendUv.value = bendUv));
  }

  // Escala da resolução interna conforme o tamanho do canvas (orçamento de pixels)
  function calcularEscala() {
    const porPixel = Math.sqrt(config.orcamentoPixels / Math.max(1, largura * altura));
    return Math.max(0.4, Math.min(config.dprMax, porPixel));
  }

  function aplicarTamanho() {
    if (!largura || !altura || !renderer) return;
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    const escala = calcularEscala();
    if (Math.abs(escala - config.dpr) > 0.02) {
      config.dpr = escala;
      renderer.setPixelRatio(escala);
      composer.setPixelRatio(escala);
    }
    renderer.setSize(largura, altura, false);
    composer.setSize(largura, altura);
    blurPass.uniforms.resolution.value.set(largura * config.dpr, altura * config.dpr);
    fxaaPass.material.uniforms.resolution.value.set(1 / (largura * config.dpr), 1 / (altura * config.dpr));
    if (reduzir && pronto) composer.render();
  }

  function avisarPronto() {
    if (avisouPronto) return;
    avisouPronto = true;
    porta.postMessage({ tipo: 'pronto' });
  }

  // Limita a 30 quadros por segundo: o tempo da animação continua correndo
  // normal, só deixamos de desenhar quadros que o olho não perceberia.
  let passoQuadro = 1 / 30;
  let acumulado = passoQuadro;
  function frame() {
    rafId = null;
    if (!running) return;
    acumulado += clock.getDelta();
    if (acumulado >= passoQuadro * 0.95) {
      globalTime += acumulado * config.speedMultiplier;
      acumulado = 0;
      trailMaterials.forEach((u) => (u.uTime.value = globalTime));
      composer.render();
      avisarPronto();
    }
    rafId = raf(frame);
  }

  function rodar(valor) {
    running = valor;
    if (running && pronto && !reduzir && rafId === null) {
      clock.getDelta();
      rafId = raf(frame);
    }
  }

  porta.onmessage = async (evento) => {
    const m = evento.data || {};
    if (m.tipo === 'testar') {
      // Só verifica se o WebGL2 existe aqui dentro, sem criar um contexto de
      // teste: criar contexto ocupa a placa de vídeo (e na thread principal
      // custava ~300 ms de travada). Se mesmo assim o WebGL falhar depois, o
      // motor avisa "falhou" e a capa fica.
      const ok = typeof OffscreenCanvas !== 'undefined' && typeof WebGL2RenderingContext !== 'undefined';
      porta.postMessage({ tipo: 'suporte', ok });
    } else if (m.tipo === 'iniciar') {
      canvas = m.canvas;
      largura = Math.max(1, m.largura);
      altura = Math.max(1, m.altura);
      reduzir = !!m.reduzir;
      config = criarConfig(m.dpr || 1, !!m.celular);
      config.dpr = calcularEscala();
      passoQuadro = 1 / config.fps;
      acumulado = passoQuadro;
      running = m.rodar !== false;
      try {
        await carregarThree();
        clock = new THREE.Clock();
        await init();
        if (canvas.addEventListener) {
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            running = false;
            porta.postMessage({ tipo: 'falhou', erro: 'contexto WebGL perdido' });
          });
        }
        pronto = true;
        if (reduzir) {
          // Sem animação: desenha um quadro parado
          trailMaterials.forEach((u) => (u.uTime.value = 0.35));
          composer.render();
          avisarPronto();
        } else {
          rodar(running);
        }
      } catch (erro) {
        porta.postMessage({ tipo: 'falhou', erro: String((erro && erro.message) || erro) });
      }
    } else if (m.tipo === 'tamanho') {
      largura = Math.max(1, m.largura);
      altura = Math.max(1, m.altura);
      aplicarTamanho();
    } else if (m.tipo === 'rodar') {
      rodar(!!m.valor);
    }
  };
}

// =====================================================================
// LADO DA PÁGINA
// =====================================================================
const hero = canvas.closest('.hero');
const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const celular = window.matchMedia('(max-width: 767px)').matches;
let enviar = null;
let encerrado = false;

// Só troca a capa pela animação depois que o 1º quadro foi desenhado de fato
function mostrarAnimacao() {
  canvas.classList.add('is-ready');
  if (hero) hero.classList.add('animacao-pronta');
}

// Sem WebGL (ou erro): some com o canvas e a capa (imagem estática) fica
function fallbackEstatico(motivo) {
  if (encerrado) return;
  encerrado = true;
  if (motivo) console.warn('Fundo animado indisponível, usando a imagem de capa:', motivo);
  if (hero) hero.classList.remove('animacao-pronta');
  canvas.remove();
}

function receber(m) {
  if (!m) return;
  if (m.tipo === 'pronto') mostrarAnimacao();
  else if (m.tipo === 'falhou') fallbackEstatico(m.erro);
}

// Tamanho do canvas na tela (no celular o CSS limita o canvas a uma faixa com
// proporção de tela, para a câmera enquadrar o piso e a parede)
const tamanho = () => ({ largura: canvas.clientWidth, altura: canvas.clientHeight });

function ligarObservadores() {
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const t = tamanho();
      if (t.largura && t.altura) enviar({ tipo: 'tamanho', ...t });
    }).observe(canvas);
  }
  // Pausa quando a hero sai da tela ou a aba fica oculta
  let visivel = true;
  const atualizar = () => enviar({ tipo: 'rodar', valor: visivel && !document.hidden });
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(([entrada]) => { visivel = entrada.isIntersecting; atualizar(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', atualizar);
}

// Checagem barata: não cria nenhum contexto WebGL na thread principal
function temOffscreenCanvas() {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' &&
    'transferControlToOffscreen' in canvas;
}

function dadosIniciais(alvo) {
  return { tipo: 'iniciar', canvas: alvo, ...tamanho(), dpr: window.devicePixelRatio || 1, celular, reduzir, rodar: !document.hidden };
}

// Caminho principal: a animação inteira roda num worker. Pode começar já,
// porque nada disso ocupa a thread principal da página. Primeiro o worker
// confirma que consegue usar WebGL (alguns Safaris têm OffscreenCanvas só para
// 2D); só então o canvas é entregue a ele. Senão, usa o motor na página.
function iniciarNoWorker() {
  const codigo = '(' + motor.toString() + ')(self);';
  const url = URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' }));
  const worker = new Worker(url);
  let entregue = false;
  worker.onmessage = (e) => {
    const m = e.data || {};
    if (m.tipo !== 'suporte') return receber(m);
    if (!m.ok) { worker.terminate(); return iniciarNaPagina(); }
    entregue = true;
    enviar = (msg) => worker.postMessage(msg);
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage(dadosIniciais(offscreen), [offscreen]);
    ligarObservadores();
  };
  worker.onerror = (e) => {
    worker.terminate();
    // se o canvas ainda não foi entregue, dá para usar o motor na página
    if (!entregue) iniciarNaPagina();
    else fallbackEstatico((e && e.message) || 'erro no worker');
  };
  worker.postMessage({ tipo: 'testar' });
}

// Reserva: sem suporte a worker com WebGL, roda o mesmo motor na página.
function iniciarNaPagina() {
  const porta = { onmessage: null, postMessage: (m) => receber(m) };
  motor(porta);
  enviar = (m) => porta.onmessage({ data: m });
  enviar(dadosIniciais(canvas));
  ligarObservadores();
}

// A placa de vídeo é compartilhada com o resto do Chrome: o worker só começa
// a criar o WebGL e compilar shaders depois que a 1ª tela da página já
// apareceu e o navegador ficou ocioso (a capa cobre o fundo até lá). Antes,
// os dois disputavam a placa e a abertura ficava parada por até ~0,6 s.
function depoisDaPrimeiraTela(fn) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 600 });
    else setTimeout(fn, 100);
  }));
}

depoisDaPrimeiraTela(() => {
  try {
    if (temOffscreenCanvas()) iniciarNoWorker();
    else iniciarNaPagina();
  } catch (e) {
    fallbackEstatico(e);
  }
});
})();
