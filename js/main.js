/* ══ FIREBASE ══ */
const firebaseConfig = {
  apiKey:            "AIzaSyBzKn5k1ZkVNYu-94_EMvoBWaRW-CHaGro",
  authDomain:        "ton-de-pele.firebaseapp.com",
  projectId:         "ton-de-pele",
  storageBucket:     "ton-de-pele.firebasestorage.app",
  messagingSenderId: "198340319657",
  appId:             "1:198340319657:web:97e4991ef922e3033a4cb8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

const WHATSAPP = '5582999004440';

const FALLBACK_DRESS_SVG = `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>`;
const HEART_FILLED_SVG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const HEART_OUTLINE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

/* ══════════════════════════════════════
   ADMIN WELCOME POPUP
══════════════════════════════════════ */
const WELCOME_STORAGE_KEY = 'tdp_admin_welcome_seen';

function showAdminWelcome() {
  // Verifica se a admin pediu para não mostrar mais
  if (localStorage.getItem(WELCOME_STORAGE_KEY) === 'true') return;
  document.getElementById('adminWelcomeOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAdminWelcome(openAdmin) {
  // Salva preferência se checkbox marcado
  if (document.getElementById('awbNoShow').checked) {
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
  }
  document.getElementById('adminWelcomeOverlay').classList.remove('active');
  document.body.style.overflow = '';
  if (openAdmin) {
    setTimeout(() => openAdminPanel(), 120);
  }
}

/* ══ AUTH ══ */
let currentUser = null;

function translateFirebaseError(code) {
  const map = {
    'auth/email-already-in-use':'E-mail já cadastrado.',
    'auth/invalid-email':'E-mail inválido.',
    'auth/weak-password':'Senha muito fraca (mín. 6 caracteres).',
    'auth/user-not-found':'E-mail ou senha incorretos.',
    'auth/wrong-password':'E-mail ou senha incorretos.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/too-many-requests':'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed':'Erro de conexão. Verifique sua internet.'
  };
  return map[code] || 'Ocorreu um erro. Tente novamente.';
}

function openLogin() {
  document.getElementById('loginOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('loginEmail').focus(), 100);
}
function closeLogin() {
  document.getElementById('loginOverlay').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('loginError').style.display = 'none';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginSubmit');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Preencha todos os campos.'; errEl.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Aguarde...';
  try {
    await auth.signInWithEmailAndPassword(email, password);
    closeLogin();
  } catch (e) {
    errEl.textContent = translateFirebaseError(e.code); errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

async function logout() { await auth.signOut(); showToast('Até logo!'); }

function updateLoginArea() {
  const area = document.getElementById('loginArea');
  const adminContainer = document.getElementById('adminBtnContainer');
  const mobileAdminContainer = document.getElementById('mobileAdminContainer');
  if (currentUser) {
    const initials = currentUser.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
    // loginArea: avatar + Admin (se admin) — visível no header desktop e mobile
    area.innerHTML = `<div class="user-info"><div class="user-avatar">${initials}</div>${currentUser.isAdmin ? `<button class="admin-btn" onclick="openAdmin()" title="Admin"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:4px;" class="admin-btn-icon"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"/></svg><span class="admin-btn-label">Admin</span></button>` : ''}</div>`;
    // adminBtnContainer: Sair — visível só no desktop
    adminContainer.innerHTML = `<button class="login-btn" onclick="logout()" style="font-size:9px;padding:6px 10px;">Sair</button>`;
    // mobile drawer: Sair
    if (mobileAdminContainer) mobileAdminContainer.innerHTML = `<button class="login-btn" onclick="closeMobileMenu();logout()">Sair</button>`;
  } else {
    area.innerHTML = `<button class="login-btn" onclick="openLogin()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Entrar</button>`;
    adminContainer.innerHTML = '';
    if (mobileAdminContainer) mobileAdminContainer.innerHTML = '';
  }
}

auth.onAuthStateChanged(async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const doc = await db.collection('users').doc(firebaseUser.uid).get();
      if (doc.exists) {
        currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, ...doc.data() };
      } else {
        const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
        currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, name, isAdmin: false };
        await db.collection('users').doc(firebaseUser.uid).set({ name, email: firebaseUser.email, isAdmin: false });
      }
    } catch(e) {
      currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.email.split('@')[0], isAdmin: false };
    }
    if (currentUser.isAdmin) {
      await seedProductsIfEmpty();
      setTimeout(() => showAdminWelcome(), 600);
    }
    syncWishlistFromFirestore();
    showToast('Olá, ' + currentUser.name.split(' ')[0] + '! ✦');
  } else {
    currentUser = null;
    wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  }
  updateLoginArea();
});

document.getElementById('loginOverlay').addEventListener('click', e => { if (e.target === document.getElementById('loginOverlay')) closeLogin(); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && document.getElementById('loginOverlay').classList.contains('active')) handleLogin(); });

/* ══ CART ══ */
let cart = [];

function openCart() {
  renderCart();
  document.getElementById('cartOverlay').classList.add('active');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('active');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

function isOutOfStock(p) { return typeof p.stock === 'number' && p.stock <= 0; }

function addToCart(productId, color, colorHex, size) {
  const p = products.find(x => x.id === productId); if (!p) return;
  if (isOutOfStock(p)) { showToast('Produto esgotado ✕'); return; }
  const key = `${productId}-${color}-${size}`;
  const existing = cart.find(i => i.key === key);
  if (existing) { existing.qty++; }
  else {
    const priceNum = parseFloat(p.price.replace(/R\$\s*/g, '').replace(',', '.').trim());
    cart.push({ key, id: productId, name: p.name, price: p.price, priceNum, color: color||'Padrão', colorHex: colorHex||p.colors[0]||'#C9848A', size: size||p.sizes[0]||'Único', qty: 1, imgSrc: p.media.length>0&&p.media[0].type==='image'?p.media[0].src:null, svgPath: p.svgPath||'' });
  }
  updateCartBadge();
  showToast('Adicionado à sacola ✓');
}

function removeFromCart(key) { const idx=cart.findIndex(i=>i.key===key); if(idx===-1)return; cart.splice(idx,1); updateCartBadge(); renderCart(); }
function changeQty(key, delta) { const item=cart.find(i=>i.key===key); if(!item)return; item.qty+=delta; if(item.qty<=0){removeFromCart(key);return;} renderCart(); }

function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = total;
  badge.classList.toggle('visible', total>0);
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const footer = document.getElementById('cartFooter');
  if (cart.length===0) {
    list.innerHTML = `<div class="cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Sua sacola está vazia</p><p style="font-size:11px;opacity:0.6;">Adicione peças para continuar</p></div>`;
    footer.style.display='none'; return;
  }
  list.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-img">${item.imgSrc?`<img src="${item.imgSrc}" alt="">`:`<div style="opacity:0.2;">${item.svgPath||FALLBACK_DRESS_SVG}</div>`}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-detail"><span class="cart-item-color-preview" style="background:${item.colorHex};"></span><span class="cart-item-color-name">${item.color}</span><span class="cart-item-size">${item.size}</span></div>
        <div class="cart-item-price">${item.price}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty('${item.key}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.key}',1)">+</button>
        </div>
      </div>
      <div class="cart-item-controls"><button class="cart-item-remove" onclick="removeFromCart('${item.key}')">✕</button></div>
    </div>`).join('');
  const total = cart.reduce((s,i)=>s+i.priceNum*i.qty,0);
  document.getElementById('cartTotal').textContent = 'R$ '+total.toFixed(2).replace('.',',');
  footer.style.display='block';
}

/* ══ CHECKOUT ══ */
let curPayment = 'pix';
let checkoutMode = 'cart';
let checkoutProduct = null;
let activeCoupon = null;

function _checkoutBaseTotal() {
  if (checkoutMode === 'cart') return cart.reduce((s,i)=>s+i.priceNum*i.qty,0);
  if (checkoutProduct) return parseFloat(checkoutProduct.price?.replace(/R\$\s*/g,'').replace(',','.')) || 0;
  return 0;
}
function _checkoutFinalTotal() {
  let t = _checkoutBaseTotal();
  if (!activeCoupon) return t;
  return activeCoupon.type === 'percent' ? t * (1 - activeCoupon.value/100) : Math.max(0, t - activeCoupon.value);
}
function updateCheckoutTotal() {
  const t = _checkoutFinalTotal();
  document.getElementById('coTotal').textContent = 'R$ ' + t.toFixed(2).replace('.',',');
}

async function applyCoupon() {
  const code = (document.getElementById('coCoupon').value||'').trim().toUpperCase();
  const fb   = document.getElementById('couponFeedback');
  if (!code) return;
  fb.style.display = 'none';
  try {
    const doc = await db.collection('coupons').doc(code).get();
    if (!doc.exists || doc.data().active === false) {
      activeCoupon = null;
      fb.textContent = 'Cupom inválido ou expirado.';
      fb.style.color = 'var(--rose-dark,#8b2e2e)';
    } else {
      activeCoupon = { code, ...doc.data() };
      const desc = activeCoupon.type === 'percent'
        ? `${activeCoupon.value}% de desconto aplicado`
        : `R$ ${activeCoupon.value.toFixed(2).replace('.',',')} de desconto aplicado`;
      fb.textContent = '✓ ' + desc;
      fb.style.color = '#2e7d2e';
    }
  } catch(e) {
    fb.textContent = 'Erro ao validar cupom.';
    fb.style.color = 'var(--rose-dark,#8b2e2e)';
  }
  fb.style.display = 'block';
  updateCheckoutTotal();
}

function _resetCouponUI() {
  activeCoupon = null;
  const inp = document.getElementById('coCoupon'); if (inp) inp.value = '';
  const fb  = document.getElementById('couponFeedback'); if (fb) fb.style.display = 'none';
}

function openCheckoutFromCart() {
  if (cart.length===0) return;
  checkoutMode = 'cart';
  checkoutProduct = null;
  _resetCouponUI();
  closeCart();
  const total = cart.reduce((s,i)=>s+i.priceNum*i.qty,0);
  const first = cart[0];
  document.getElementById('coProdSummary').innerHTML = `
    <div class="co-product-thumb">${first.imgSrc?`<img src="${first.imgSrc}" alt="">`:first.svgPath||FALLBACK_DRESS_SVG}</div>
    <div class="co-product-info"><strong>${cart.length>1?cart.length+' itens':first.name}</strong><span>${cart.length>1?'Vários itens na sacola':first.size}</span></div>
    <div class="co-product-price">R$ ${total.toFixed(2).replace('.',',')}</div>`;
  document.getElementById('coTotal').textContent = 'R$ '+total.toFixed(2).replace('.',',');
  document.getElementById('checkoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() { document.getElementById('checkoutOverlay').classList.remove('active'); document.body.style.overflow=''; }

function selPay(btn, type) {
  curPayment=type;
  document.querySelectorAll('.pay-opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}

function togglePickup() {
  const c = document.getElementById('coPickup').checked;
  ['coCep','coState','coCity','coStreet','coNum','coComp','coNeigh'].forEach(id=>{
    const el=document.getElementById(id); el.disabled=c; el.style.opacity=c?'0.4':'1';
  });
}
function maskCep(i) {
  let v = i.value.replace(/\D/g,'');
  if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,8);
  i.value = v;
  if (v.replace('-','').length === 8) lookupCep(v.replace('-',''));
}
async function lookupCep(cep) {
  try {
    const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) { el.value = val; el.disabled = false; el.style.opacity = '1'; } };
    set('coStreet', data.logradouro);
    set('coNeigh',  data.bairro);
    set('coCity',   data.localidade);
    set('coState',  data.uf);
    setTimeout(() => document.getElementById('coNum')?.focus(), 50);
  } catch(e) { /* silently ignore network errors */ }
}

async function submitOrder() {
  const name=document.getElementById('coName').value.trim();
  const phone=document.getElementById('coPhone').value.trim();
  const email=document.getElementById('coEmail').value.trim();
  const pickup=document.getElementById('coPickup').checked;
  const street=document.getElementById('coStreet').value.trim();
  const num=document.getElementById('coNum').value.trim();
  const city=document.getElementById('coCity').value.trim();
  const state=document.getElementById('coState').value.trim();
  const neigh=document.getElementById('coNeigh').value.trim();
  if(!name){showToast('Informe seu nome!');return;}
  if(!phone){showToast('Informe seu WhatsApp!');return;}
  if(!pickup&&(!street||!city)){showToast('Informe o endereço!');return;}
  const pays={pix:'Pix',cartao:'Cartão',boleto:'Boleto',whatsapp:'WhatsApp'};
  const finalTotal = _checkoutFinalTotal();
  let msg = '🛍️ *Pedido Ton de Pele Lingerie*\n\n';
  const orderItems = [];
  if (checkoutMode==='cart') {
    cart.forEach((item,i)=>{
      msg+=`*${i+1}. ${item.name}*\n   Cor: ${item.color} | Tamanho: ${item.size} | Qtd: ${item.qty}\n   Valor: ${item.price}\n\n`;
      orderItems.push({name:item.name,color:item.color,size:item.size,qty:item.qty,price:item.price,priceNum:item.priceNum});
    });
  }
  if (activeCoupon) msg += `🏷️ Cupom: ${activeCoupon.code}\n`;
  msg+=`*Total: R$ ${finalTotal.toFixed(2).replace('.',',')}*\n`;
  msg+=`\n👤 Nome: ${name}\n📞 WhatsApp: ${phone}\n`;
  msg+=pickup?`🏬 Retirada na loja\n`:`📍 ${street}${num?', '+num:''}, ${neigh?neigh+', ':''}${city}${state?'/'+state:''}\n`;
  msg+=`💳 Pagamento: ${pays[curPayment]}`;
  // Save order to Firestore (fire-and-forget)
  const orderData = {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    name, phone, email: email||'',
    pickup,
    address: pickup ? 'Retirada na loja' : `${street}${num?', '+num:''}, ${neigh?neigh+', ':''}${city}${state?'/'+state:''}`,
    payment: pays[curPayment],
    items: orderItems,
    baseTotal: _checkoutBaseTotal(),
    total: finalTotal,
    coupon: activeCoupon ? activeCoupon.code : null,
    discount: activeCoupon ? (_checkoutBaseTotal() - finalTotal) : 0,
    status: 'novo',
    uid: currentUser ? currentUser.uid : null
  };
  try { await db.collection('orders').add(orderData); } catch(e) { console.warn('Pedido não salvo no Firestore:', e); }
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank');
  closeCheckout();
  showToast('Pedido enviado! ✓');
  cart.length = 0; updateCartBadge();
}

document.getElementById('checkoutOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('checkoutOverlay'))closeCheckout();});

/* ══ DATA STORE ══ */
const SEED_PRODUCTS = [
  {id:1,cat:'Conjunto',name:'Rendas de Seda Rosa',price:'R$ 289,00',oldPrice:'',badge:'new',colors:['#C9848A','#2A1F1F','#E8D5C4'],sizes:['PP','P','M','G','GG'],desc:'Conjunto em renda de seda com acabamento delicado. Soutien com alças reguláveis e calcinha de corte alto. Tecido respirável para maior conforto.',media:[],ytLink:'',svgPath:`<svg width="80" height="100" viewBox="0 0 80 100" fill="none"><path d="M20 10 Q40 0 60 10 L70 30 Q60 25 40 28 Q20 25 10 30 Z" fill="#C9848A"/><path d="M10 30 Q20 25 40 28 Q60 25 70 30 L65 90 Q40 95 15 90 Z" fill="#C9848A" opacity="0.7"/></svg>`},
  {id:2,cat:'Camisola',name:'Cetim Noite Dourada',price:'R$ 294,00',oldPrice:'R$ 420,00',badge:'sale',colors:['#C8A96E','#E8D5C4','#8B4A50'],sizes:['P','M','G'],desc:'Camisola em cetim com caimento elegante. Alças finas com detalhe em renda e comprimento midi. Tecido suave ao toque.',media:[],ytLink:'',svgPath:`<svg width="70" height="110" viewBox="0 0 70 110" fill="none"><path d="M15 5 Q35 0 55 5 L60 20 L50 18 L50 105 L20 105 L20 18 L10 20 Z" fill="#C9848A" opacity="0.8"/><path d="M20 18 Q35 22 50 18 L50 35 Q35 38 20 35 Z" fill="#2A1F1F" opacity="0.3"/></svg>`},
  {id:3,cat:'Body',name:'Veludo Suave Nero',price:'R$ 345,00',oldPrice:'',badge:'',colors:['#2A1F1F','#8B4A50','#C9848A'],sizes:['PP','P','M','G','GG'],desc:'Body em veludo com decote profundo e fechamento em botões de pressão. Elástico na cintura para melhor ajuste.',media:[],ytLink:'',svgPath:`<svg width="85" height="95" viewBox="0 0 85 95" fill="none"><ellipse cx="42" cy="30" rx="28" ry="20" fill="#C9848A" opacity="0.6"/><path d="M14 30 Q20 55 15 90 L70 90 Q65 55 71 30 Q55 50 42 48 Q29 50 14 30Z" fill="#C9848A" opacity="0.85"/></svg>`},
  {id:4,cat:'Pijama',name:'Algodão Pima Blanc',price:'R$ 198,00',oldPrice:'',badge:'new',colors:['#FAF6F1','#C9848A','#9FB5C0'],sizes:['P','M','G','GG'],desc:'Pijama em algodão pima 100%, o mais macio entre os cottons. Camisa de botão e calça com elástico. Ideal para noites frescas.',media:[],ytLink:'',svgPath:`<svg width="75" height="105" viewBox="0 0 75 105" fill="none"><path d="M10 0 L65 0 L65 60 Q37 75 10 60 Z" fill="#C9848A" opacity="0.5"/><path d="M10 60 Q37 75 65 60 L65 105 L10 105 Z" fill="#C9848A" opacity="0.85"/><line x1="37" y1="0" x2="37" y2="60" stroke="#2A1F1F" stroke-width="1" opacity="0.2"/></svg>`},
  {id:5,cat:'Moda Praia',name:'Biquíni Strappy Coral',price:'R$ 249,00',oldPrice:'',badge:'',colors:['#D8634A','#2A1F1F','#5A7A8A'],sizes:['PP','P','M','G'],desc:'Biquíni strappy com amarrações ajustáveis. Top triangular e calcinha de corte médio. Resistente ao cloro e à água salgada.',media:[],ytLink:'',svgPath:`<svg width="90" height="80" viewBox="0 0 90 80" fill="none"><ellipse cx="45" cy="35" rx="38" ry="28" fill="#C9848A" opacity="0.45"/><path d="M7 35 Q15 60 25 72 L65 72 Q75 60 83 35 Q65 55 45 52 Q25 55 7 35Z" fill="#C9848A" opacity="0.8"/></svg>`},
  {id:6,cat:'Vestido',name:'Slip Dress Ivoire',price:'R$ 416,00',oldPrice:'R$ 520,00',badge:'sale',colors:['#E8D5C4','#2A1F1F'],sizes:['PP','P','M','G'],desc:'Slip dress em cetim marfim com recortes minimalistas. Alças finas e comprimento midi. Pode ser usado como vestido ou por baixo de blazers.',media:[],ytLink:'',svgPath:`<svg width="75" height="105" viewBox="0 0 75 105" fill="none"><path d="M20 0 L55 0 L62 20 L50 18 L50 110 L25 110 L25 18 L13 20 Z" fill="#C9848A" opacity="0.7"/><path d="M13 20 Q37 30 62 20 L60 40 Q37 48 15 40 Z" fill="#8B4A50" opacity="0.5"/></svg>`},
  {id:7,cat:'Sutiã',name:'Triângulo Rendado Preto',price:'R$ 165,00',oldPrice:'',badge:'new',colors:['#2A1F1F','#C9848A','#FAF6F1'],sizes:['PP','P','M','G','GG'],desc:'Sutiã triangular em renda sem aro. Design minimalista com alças finas ajustáveis. Peça versátil para o dia a dia.',media:[],ytLink:'',svgPath:`<svg width="88" height="65" viewBox="0 0 88 65" fill="none"><path d="M8 10 Q44 0 80 10 L85 55 Q44 65 3 55 Z" fill="#C9848A" opacity="0.6"/><path d="M25 10 Q44 5 63 10 L63 30 Q44 35 25 30 Z" fill="#2A1F1F" opacity="0.25"/></svg>`},
  {id:8,cat:'Conjunto',name:'Microfibra Douceur Blush',price:'R$ 312,00',oldPrice:'',badge:'',colors:['#E8A8A8','#C9848A','#2A1F1F'],sizes:['P','M','G'],desc:'Conjunto em microfibra super macia na cor blush. Soutien com bojo levinho e calcinha de corte francês. Conforto sem abrir mão do charme.',media:[],ytLink:'',svgPath:`<svg width="78" height="100" viewBox="0 0 78 100" fill="none"><path d="M5 15 Q39 0 73 15 L73 45 Q57 40 39 42 Q21 40 5 45 Z" fill="#C9848A" opacity="0.55"/><path d="M5 45 Q21 40 39 42 Q57 40 73 45 L70 100 L8 100 Z" fill="#C9848A" opacity="0.82"/></svg>`}
];

let products = [];
let selectedProductId = null;
let currentModalProduct = null;

/* ══ SKELETON SCREENS ══ */
function showSkeletons(count) {
  count = count || 8;
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  var skCard = '<div class="card-skeleton"><div class="sk-img"></div><div class="sk-line short"></div><div class="sk-line medium"></div><div class="sk-line short"></div></div>';
  var html = '';
  for (var i = 0; i < count; i++) html += skCard;
  grid.innerHTML = html;
}

async function loadProducts() {
  showSkeletons();
  try {
    const snap = await db.collection('products').orderBy('id').get();
    products = snap.empty ? SEED_PRODUCTS.map(p=>({...p,_docId:null})) : snap.docs.map(doc=>({_docId:doc.id,...doc.data()}));
  } catch(e) {
    console.warn('Firestore indisponivel. Usando dados locais.');
    products = SEED_PRODUCTS.map(p=>({...p,_docId:null}));
  }
  // Sanitize prices that may have been saved with double "R$ " prefix
  products.forEach(p => {
    const clean = v => v ? 'R$ ' + v.replace(/R\$\s*/g, '').trim() : v;
    p.price    = clean(p.price);
    p.oldPrice = p.oldPrice ? clean(p.oldPrice) : '';
  });
  selectedProductId = products.length>0 ? products[0].id : null;
  renderGrid();
  // Open product if URL has ?p=ID (share link)
  const sharedId = parseInt(new URLSearchParams(location.search).get('p'));
  if (sharedId) setTimeout(() => openProduct(sharedId), 300);
}

/* ══ HEADER SCROLL EFFECT ══ */
window.addEventListener('scroll', () => {
  document.querySelector('header')?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
async function seedProductsIfEmpty() {
  try {
    const snap = await db.collection('products').limit(1).get();
    if (!snap.empty) return;
    const batch = db.batch();
    SEED_PRODUCTS.forEach(p => batch.set(db.collection('products').doc(String(p.id)), p));
    await batch.commit();
    products = SEED_PRODUCTS.map(p=>({...p,_docId:String(p.id)}));
    selectedProductId = products[0].id;
    renderGrid();
  } catch(e) { console.warn('Semeadura falhou:',e); }
}

/* ══ WISHLIST ══ */
const WISHLIST_KEY = 'tdp_wishlist';
let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');

async function saveWishlist() {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  if (currentUser) {
    try { await db.collection('users').doc(currentUser.uid).update({ wishlist }); } catch(e) {}
  }
}

async function syncWishlistFromFirestore() {
  if (!currentUser) return;
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const remote = (doc.exists && Array.isArray(doc.data().wishlist)) ? doc.data().wishlist : [];
    wishlist = [...new Set([...wishlist, ...remote])];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    await db.collection('users').doc(currentUser.uid).update({ wishlist });
    renderWishlist();
    // refresh heart icons on grid
    wishlist.forEach(id => {
      const btn = document.getElementById('fav-btn-'+id);
      if (btn) { btn.innerHTML = HEART_FILLED_SVG; btn.style.color = 'var(--rose)'; }
    });
  } catch(e) {}
}

function toggleWishlist(id, btnEl, e) {
  if (e) e.stopPropagation();
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    if (btnEl) { btnEl.innerHTML = HEART_FILLED_SVG; btnEl.style.color = 'var(--rose)'; }
    showToast('Adicionado aos favoritos ✓');
  } else {
    wishlist.splice(idx, 1);
    if (btnEl) { btnEl.innerHTML = HEART_OUTLINE_SVG; btnEl.style.color = ''; }
    showToast('Removido dos favoritos');
  }
  saveWishlist();
  renderWishlist();
}

function openWishlist() {
  const overlay = document.getElementById('wishlistOverlay');
  const drawer  = document.getElementById('wishlistDrawer');
  if (!overlay || !drawer) return;
  renderWishlist();
  overlay.classList.add('active');
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeWishlist() {
  const overlay = document.getElementById('wishlistOverlay');
  const drawer  = document.getElementById('wishlistDrawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('active');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}

function renderWishlist() {
  const list = document.getElementById('wishlistItemsList');
  if (!list) return;
  const favProds = products.filter(p => wishlist.includes(p.id));
  if (favProds.length === 0) {
    list.innerHTML = `<div class="cart-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <p>Nenhum favorito ainda</p>
      <p style="font-size:11px;opacity:0.6;">Clique no <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> nas peças para salvar</p>
    </div>`;
    return;
  }
  list.innerHTML = favProds.map(p => {
    const imgHTML = p.media.length > 0 && p.media[0].type === 'image'
      ? `<img src="${p.media[0].src}" alt="">`
      : `<div style="opacity:0.2;">${p.svgPath || FALLBACK_DRESS_SVG}</div>`;
    return `<div class="cart-item">
      <div class="cart-item-img">${imgHTML}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-detail">${p.cat}</div>
        <div class="cart-item-price">${p.price}</div>
        <button class="quick-add" style="position:static;transform:none;margin-top:8px;font-size:9px;padding:8px 10px;"
          onclick="addToCart(${p.id},'${p.colors[0]}','${p.colors[0]}','${p.sizes[0]}');closeWishlist();">+ Adicionar ao carrinho</button>
      </div>
      <div class="cart-item-controls">
        <button class="cart-item-remove" title="Remover dos favoritos" onclick="toggleWishlist(${p.id},null,event);renderWishlist()">✕</button>
      </div>
    </div>`;
  }).join('');
}

/* ══ GRID ══ */
let currentFilter = null;
let currentSort   = '';

function priceVal(p) { return parseFloat(p.price.replace(/R\$\s*/g,'').replace(',','.')) || 0; }

function renderGrid(filter) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  if (typeof filter === 'string') filter = filter ? { cat: filter } : null;
  currentFilter = filter !== undefined ? filter : currentFilter;
  let filtered = [...products];
  if (currentFilter) {
    if (currentFilter.cat)   filtered = filtered.filter(p => p.cat === currentFilter.cat);
    if (currentFilter.badge) filtered = filtered.filter(p => p.badge === currentFilter.badge);
    if (currentFilter.q) {
      const q = currentFilter.q.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q) ||
        (p.desc && p.desc.toLowerCase().includes(q))
      );
    }
  }
  // Apply sort
  if (currentSort === 'price_asc')  filtered.sort((a,b) => priceVal(a) - priceVal(b));
  else if (currentSort === 'price_desc') filtered.sort((a,b) => priceVal(b) - priceVal(a));
  else if (currentSort === 'new')   filtered.sort((a,b) => (b.badge==='new'?1:0) - (a.badge==='new'?1:0));
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted);font-size:13px;letter-spacing:1px;">Nenhuma peça encontrada</div>';
    return;
  }
  filtered.forEach(p => {
    const hasImg = p.media.length > 0 && p.media[0].type === 'image';
    const imgHTML = hasImg ? `<img src="${p.media[0].src}" alt="${p.name}" loading="lazy">` : p.svgPath || '';
    const outOfStock = isOutOfStock(p);
    let badgeHTML = '';
    if (outOfStock) badgeHTML = `<span class="card-badge esgotado">Esgotado</span>`;
    else if (p.badge) badgeHTML = `<span class="card-badge ${p.badge}">${p.badge === 'new' ? 'Novo' : '-' + getDiscount(p) + '%'}</span>`;
    const priceHTML = p.oldPrice ? `<span class="old">${p.oldPrice}</span><span class="sale-p">${p.price}</span>` : p.price;
    const colorsHTML = p.colors.map(c => `<div class="color-dot" style="background:${c}" title="${c}"></div>`).join('');
    const isFav = wishlist.includes(p.id);
    const heartStyle = isFav ? 'color:var(--rose);' : '';
    const heartChar = isFav ? HEART_FILLED_SVG : HEART_OUTLINE_SVG;
    const quickAddBtn = outOfStock
      ? `<button class="quick-add quick-add-disabled" disabled onclick="event.stopPropagation()">Esgotado</button>`
      : `<button class="quick-add" onclick="event.stopPropagation();quickAdd(${p.id})">+ Adicionar ao carrinho</button>`;
    grid.innerHTML += `<div class="card${outOfStock?' card-out-of-stock':''}" onclick="openProduct(${p.id})">
      <div class="card-img">
        <div class="card-img-placeholder">${imgHTML}</div>
        ${badgeHTML}
        <div class="card-actions">
          <button class="action-btn" id="fav-btn-${p.id}" style="${heartStyle}" onclick="toggleWishlist(${p.id},this,event)" title="Favoritar">${heartChar}</button>
          <button class="action-btn" onclick="event.stopPropagation();openProduct(${p.id})" title="Ver detalhes">⤢</button>
        </div>
        ${quickAddBtn}
      </div>
      <div class="card-cat">${p.cat}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-price">${priceHTML}</div>
      <div class="colors">${colorsHTML}</div>
    </div>`;
  });
}

function quickAdd(id) { const p = products.find(x => x.id === id); if (p) addToCart(id, p.colors[0], p.colors[0], p.sizes[0]); }
function getDiscount(p) { const o = parseFloat(p.oldPrice.replace('R$ ', '').replace(',', '.')); const c = parseFloat(p.price.replace('R$ ', '').replace(',', '.')); return Math.round((1 - c / o) * 100); }

/* ══ PRODUCT MODAL ══ */
function openProduct(id) {
  const p = products.find(x=>x.id===id); if(!p) return;
  currentModalProduct = p;
  document.getElementById('modalCat').textContent = p.cat;
  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalPrice').innerHTML = p.oldPrice?`<span class="old">${p.oldPrice}</span><span class="sale-p">${p.price}</span>`:p.price;
  document.getElementById('modalDesc').textContent = p.desc||'Peça exclusiva da coleção Ton de Pele Lingerie.';
  document.getElementById('modalColors').innerHTML = p.colors.map((c,i)=>`<div class="modal-color${i===0?' selected':''}" style="background:${c}" data-hex="${c}" onclick="selectColor(this)" title="${c}"></div>`).join('');
  document.getElementById('modalSizes').innerHTML = p.sizes.map((s,i)=>`<button class="size-btn${i===0?' selected':''}" onclick="selectSize(this)">${s}</button>`).join('');
  buildSizeGuide(p);
  buildGallery(p);
  const ytBlock = document.getElementById('modalYtBlock');
  const ytFrame = document.getElementById('modalYtFrame');
  const ytBtn = document.getElementById('modalYtOpenBtn');
  if (p.ytLink) {
    const ytId = extractYtId(p.ytLink);
    if (ytId) { ytFrame.src=`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`; ytBtn.onclick=()=>window.open(p.ytLink,'_blank'); ytBlock.style.display='block'; }
    else { ytBlock.style.display='none'; }
  } else { ytFrame.src=''; ytBlock.style.display='none'; }
  const btn = document.getElementById('modalAddBtn');
  btn.classList.remove('modal-add-success');
  const outOfStock = isOutOfStock(p);
  if (outOfStock) {
    btn.disabled = true;
    btn.classList.add('modal-add-esgotado');
    btn.innerHTML = 'Produto Esgotado';
  } else {
    btn.disabled = false;
    btn.classList.remove('modal-add-esgotado');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Adicionar ao carrinho`;
  }
  const stockInfoEl = document.getElementById('modalStockInfo');
  if (stockInfoEl) {
    if (typeof p.stock === 'number') {
      stockInfoEl.textContent = outOfStock ? 'Esgotado' : `${p.stock} em estoque`;
      stockInfoEl.style.display = 'block';
      stockInfoEl.style.color = outOfStock ? 'var(--rose-dark)' : 'var(--muted)';
    } else {
      stockInfoEl.style.display = 'none';
    }
  }
  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function addToCartFromModal() {
  if (!currentModalProduct) return;
  const colorEl = document.querySelector('#modalColors .modal-color.selected');
  const sizeEl = document.querySelector('#modalSizes .size-btn.selected');
  const colorHex = colorEl ? colorEl.dataset.hex : currentModalProduct.colors[0];
  const size = sizeEl ? sizeEl.textContent : currentModalProduct.sizes[0];
  addToCart(currentModalProduct.id, colorHex, colorHex, size);
  const btn = document.getElementById('modalAddBtn');
  btn.classList.add('modal-add-success');
  btn.innerHTML = '✓ Adicionado à sacola';
  setTimeout(()=>{ btn.classList.remove('modal-add-success'); btn.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Adicionar ao carrinho`; }, 2000);
}

let _galleryItems = [];
function setGalleryItem(idx) {
  const main = document.getElementById('galleryMain');
  document.getElementById('galleryThumbs').querySelectorAll('.thumb').forEach((t,i)=>t.classList.toggle('active',i===idx));
  const item = _galleryItems[idx];
  if (item.kind==='placeholder') main.innerHTML=`<div class="placeholder-art">${item.svg}</div>`;
  else if (item.type==='image') main.innerHTML=`<img src="${item.src}" alt="Produto">`;
  else if (item.type==='video') main.innerHTML=`<video src="${item.src}" controls muted playsinline></video>`;
  else if (item.kind==='youtube') main.innerHTML=`<iframe class="yt-embed" src="https://www.youtube.com/embed/${item.id}?rel=0" allowfullscreen></iframe>`;
}
function buildGallery(p) {
  const items = [];
  if (p.media.length===0) items.push({kind:'placeholder',svg:p.svgPath});
  else { p.media.forEach(m=>items.push(m)); if(p.ytLink){const ytId=extractYtId(p.ytLink);if(ytId)items.push({kind:'youtube',id:ytId});} }
  _galleryItems = items;
  document.getElementById('galleryThumbs').innerHTML = items.map((item,idx)=>{
    let inner='';
    if(item.kind==='placeholder') inner=`<div style="opacity:0.3;">${item.svg||FALLBACK_DRESS_SVG}</div>`;
    else if(item.type==='image') inner=`<img src="${item.src}" alt="">`;
    else if(item.type==='video') inner=`<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="media-type-badge">Vídeo</span>`;
    else if(item.kind==='youtube') inner=`<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="media-type-badge">YT</span>`;
    return `<div class="thumb${idx===0?' active':''}" onclick="setGalleryItem(${idx})">${inner}</div>`;
  }).join('');
  setGalleryItem(0);
}
function extractYtId(url) { const m=url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null; }
function closeModal() { document.getElementById('productModal').classList.remove('active'); document.getElementById('modalYtFrame').src=''; document.body.style.overflow=''; currentModalProduct=null; }
function selectColor(el) { el.closest('.modal-colors').querySelectorAll('.modal-color').forEach(c=>c.classList.remove('selected')); el.classList.add('selected'); }
function selectSize(el) { el.closest('.modal-sizes').querySelectorAll('.size-btn').forEach(b=>b.classList.remove('selected')); el.classList.add('selected'); }

function shareProduct() {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  const base = location.origin + location.pathname;
  const url  = `${base}?p=${p.id}`;
  if (navigator.share) {
    navigator.share({ title: p.name, text: `Olha essa peça da Ton de Pele: ${p.name} — ${p.price}`, url }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copiado!'))
      .catch(() => showToast('Link: ' + url));
  }
}

/* ══ GUIA DE MEDIDAS ══ */
const MEASURE_COLS = ['Busto (cm)','Cintura (cm)','Quadril (cm)'];
const MEASURE_KEYS = ['busto','cintura','quadril'];

function buildSizeGuide(p) {
  const toggle=document.getElementById('sizeGuideToggle'); const wrap=document.getElementById('sizeGuideWrap'); const table=document.getElementById('sizeGuideTable');
  wrap.classList.remove('open');
  if(!p.measurements||Object.keys(p.measurements).length===0){toggle.style.display='none';return;}
  const sizes=p.sizes.filter(s=>p.measurements[s]);
  if(sizes.length===0){toggle.style.display='none';return;}
  toggle.style.display='inline-block'; toggle.textContent='Guia de medidas ▾';
  table.innerHTML=`<thead><tr><th>Tamanho</th>${MEASURE_COLS.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${sizes.map(s=>{const m=p.measurements[s];return`<tr><td><strong>${s}</strong></td>${MEASURE_KEYS.map(k=>`<td>${m[k]||'—'}</td>`).join('')}</tr>`;}).join('')}</tbody>`;
}
function toggleSizeGuide() { const wrap=document.getElementById('sizeGuideWrap'); const toggle=document.getElementById('sizeGuideToggle'); const open=wrap.classList.toggle('open'); toggle.textContent=open?'Guia de medidas ▴':'Guia de medidas ▾'; }
function refreshMeasurementsEditor() { const sizes=document.getElementById('editSizes').value.split(',').map(s=>s.trim()).filter(Boolean); const p=products.find(x=>x.id===selectedProductId); renderMeasurementsEditor(sizes,(p&&p.measurements)?p.measurements:{}); }
function renderMeasurementsEditor(sizes,current) {
  const container=document.getElementById('measurementsEditor');
  if(sizes.length===0){container.innerHTML='<p style="font-size:11px;color:var(--muted);">Adicione tamanhos acima para editar as medidas.</p>';return;}
  container.innerHTML=`<table style="border-collapse:collapse;margin-top:4px;"><thead><tr><th style="padding:4px 6px;font-size:10px;letter-spacing:1.5px;font-weight:400;text-align:left;"></th>${MEASURE_COLS.map(c=>`<th style="padding:4px 4px;font-size:10px;letter-spacing:1px;font-weight:400;color:var(--muted);">${c.split(' ')[0]}</th>`).join('')}</tr></thead><tbody>${sizes.map(s=>{const m=current[s]||{};return`<tr><td style="padding:4px 6px;font-size:11px;font-weight:500;white-space:nowrap;">${s}</td>${MEASURE_KEYS.map((k,i)=>`<td style="padding:4px 4px;"><input type="text" data-size="${s}" data-key="${k}" value="${m[k]||''}" placeholder="${MEASURE_COLS[i].split(' ')[0]}" style="width:72px;padding:4px 6px;border:1px solid var(--border);font-size:11px;font-family:'Jost',sans-serif;background:var(--cream);"></td>`).join('')}</tr>`;}).join('')}</tbody></table><p style="font-size:10px;color:var(--muted);margin-top:4px;">Deixe em branco os campos que não se aplicam.</p>`;
}
function getMeasurementsFromEditor() {
  const result={};
  document.querySelectorAll('#measurementsEditor input[data-size]').forEach(input=>{const size=input.dataset.size;const key=input.dataset.key;const val=input.value.trim();if(val){if(!result[size])result[size]={};result[size][key]=val;}});
  return result;
}

document.getElementById('productModal').addEventListener('click',e=>{if(e.target===document.getElementById('productModal'))closeModal();});

/* ══ ADMIN ══ */
let adminColors = [];

function openAdmin() {
  if (!currentUser||!currentUser.isAdmin){openLogin();return;}
  // Mostra welcome se a admin não pediu para não mostrar mais
  if (localStorage.getItem(WELCOME_STORAGE_KEY) !== 'true') {
    showAdminWelcome();
    return; // o botão "Entendi" do popup abre o painel
  }
  openAdminPanel();
}

function openAdminPanel() {
  renderAdminList();
  if(products.length>0) selectAdminProduct(selectedProductId||products[0].id);
  document.getElementById('adminOverlay').classList.add('active');
  document.body.style.overflow='hidden';
}

function closeAdmin() { document.getElementById('adminOverlay').classList.remove('active'); document.body.style.overflow=''; renderGrid(); }

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((t,i)=>t.classList.toggle('active',['products','media','details','testimonials','orders'][i]===tab));
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
}

function renderAdminList() {
  document.getElementById('adminProductList').innerHTML = products.map(p=>`
    <div class="admin-product-item${p.id===selectedProductId?' selected':''}" data-id="${p.id}" onclick="selectAdminProduct(${p.id})">
      <div class="admin-product-thumb">${p.media.length>0&&p.media[0].type==='image'?`<img src="${p.media[0].src}" alt="">`:p.svgPath||FALLBACK_DRESS_SVG}</div>
      <div class="admin-product-info"><strong>${p.name}</strong><span>${p.cat} · ${p.price}</span></div>
      <button class="admin-edit-btn" onclick="event.stopPropagation();selectAdminProduct(${p.id});switchTab('details')">Editar →</button>
    </div>`).join('');
}

function selectAdminProduct(id) {
  selectedProductId=id; const p=products.find(x=>x.id===id); if(!p) return;
  document.querySelectorAll('.admin-product-item').forEach(el=>el.classList.toggle('selected',parseInt(el.dataset.id)===id));
  document.getElementById('selectedProductName').textContent=p.name;
  document.getElementById('selectedProductName2').textContent=p.name;
  document.getElementById('editName').value=p.name;
  document.getElementById('editCat').value=p.cat;
  document.getElementById('editPrice').value=p.price.replace('R$ ','');
  document.getElementById('editOldPrice').value=p.oldPrice?p.oldPrice.replace('R$ ',''):'';
  document.getElementById('editStock').value=typeof p.stock==='number'?p.stock:'';
  document.getElementById('editDesc').value=p.desc||'';
  document.getElementById('editSizes').value=p.sizes.join(', ');
  document.getElementById('editBadge').value=p.badge||'';
  adminColors=[...p.colors]; renderAdminColors();
  renderMeasurementsEditor(p.sizes,p.measurements||{});
  document.getElementById('ytLinkInput').value=p.ytLink||'';
  renderMediaPreview(p);
}

function renderAdminColors() { document.getElementById('adminColorsRow').innerHTML=adminColors.map((c,i)=>`<div class="admin-color-chip" style="background:${c};" title="${c}"><div class="remove-color" onclick="removeAdminColor(${i})">✕</div></div>`).join(''); }
function removeAdminColor(idx){adminColors.splice(idx,1);renderAdminColors();}
function toggleAdminPicker(e){e.stopPropagation();document.getElementById('adminColorPicker').classList.toggle('open');}
function syncAdminHex(){const c=document.getElementById('adminColorInput').value;document.getElementById('adminHexInput').value=c;document.getElementById('adminColorPreview').style.background=c;}
function syncAdminColor(){let hex=document.getElementById('adminHexInput').value.trim();if(!hex.startsWith('#'))hex='#'+hex;document.getElementById('adminColorInput').value=hex;document.getElementById('adminColorPreview').style.background=hex;}
function applyAdminColor(){adminColors.push(document.getElementById('adminColorInput').value);renderAdminColors();document.getElementById('adminColorPicker').classList.remove('open');}

function renderMediaPreview(p) { document.getElementById('mediaPreviewGrid').innerHTML=p.media.map((m,idx)=>`<div class="media-preview-item">${m.type==='image'?`<img src="${m.src}" alt="">`:`<video src="${m.src}" muted></video>`}<span class="media-type-badge">${m.type==='image'?'Foto':'Vídeo'}</span><button class="remove-media" onclick="removeMedia(${p.id},${idx})">✕</button></div>`).join(''); }
function removeMedia(pid,idx){const p=products.find(x=>x.id===pid);p.media.splice(idx,1);renderMediaPreview(p);}

function compressImage(dataUrl, maxPx, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let {width: w, height: h} = img;
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else        { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/webp', quality));
    };
    img.src = dataUrl;
  });
}

function handleMediaUpload(event) {
  const p=products.find(x=>x.id===selectedProductId); if(!p) return;
  Array.from(event.target.files).forEach(file=>{
    if(file.type.startsWith('video/')){
      const reader=new FileReader();
      reader.onload=e=>{p.media.push({type:'video',src:e.target.result});renderMediaPreview(p);};
      reader.readAsDataURL(file);
    } else {
      const reader=new FileReader();
      reader.onload=async e=>{
        const compressed=await compressImage(e.target.result,2400,0.95);
        p.media.push({type:'image',src:compressed});
        renderMediaPreview(p);
      };
      reader.readAsDataURL(file);
    }
  });
  event.target.value='';
}

async function saveMedia(){const p=products.find(x=>x.id===selectedProductId);if(!p)return;p.ytLink=document.getElementById('ytLinkInput').value.trim();await persistProduct(p);showToast('Mídias salvas!');}

async function saveDetails() {
  const p=products.find(x=>x.id===selectedProductId); if(!p) return;
  p.name=document.getElementById('editName').value.trim()||p.name;
  p.cat=document.getElementById('editCat').value;
  const pr=document.getElementById('editPrice').value.trim().replace(/R\$\s*/g,''); const op=document.getElementById('editOldPrice').value.trim().replace(/R\$\s*/g,'');
  p.price=pr?'R$ '+pr:p.price; p.oldPrice=op?'R$ '+op:'';
  const stockVal=document.getElementById('editStock').value.trim();
  p.stock = stockVal !== '' ? parseInt(stockVal, 10) : null;
  p.desc=document.getElementById('editDesc').value.trim();
  p.sizes=document.getElementById('editSizes').value.split(',').map(s=>s.trim()).filter(Boolean);
  p.colors=adminColors.length>0?adminColors:p.colors;
  p.badge=document.getElementById('editBadge').value;
  p.measurements=getMeasurementsFromEditor();
  await persistProduct(p);
  renderAdminList();
  document.getElementById('selectedProductName').textContent=p.name;
  document.getElementById('selectedProductName2').textContent=p.name;
  showToast('Detalhes salvos!');
}

async function deleteProduct() {
  const p=products.find(x=>x.id===selectedProductId);
  if(!confirm(`Remover "${p?.name}"? Esta ação não pode ser desfeita.`)) return;
  try{if(p._docId) await db.collection('products').doc(p._docId).delete();}catch(e){console.warn(e);}
  const idx=products.findIndex(x=>x.id===selectedProductId); products.splice(idx,1);
  if(products.length>0) selectAdminProduct(products[0].id);
  else document.getElementById('adminProductList').innerHTML='<p style="color:var(--muted);font-size:12px;text-align:center;padding:2rem;">Nenhuma peça cadastrada.</p>';
  renderAdminList(); showToast('Peça removida!');
}

async function addNewProduct() {
  const newId=(products.length>0?Math.max(...products.map(p=>p.id)):0)+1;
  const np={id:newId,cat:'Conjunto',name:'Nova Peça '+newId,price:'R$ 0,00',oldPrice:'',badge:'',colors:['#C9848A'],sizes:['P','M','G'],desc:'',media:[],ytLink:'',svgPath:`<svg width="80" height="100" viewBox="0 0 80 100" fill="none"><path d="M20 10 Q40 0 60 10 L70 30 Q60 25 40 28 Q20 25 10 30 Z" fill="#C9848A"/><path d="M10 30 Q20 25 40 28 Q60 25 70 30 L65 90 Q40 95 15 90 Z" fill="#C9848A" opacity="0.7"/></svg>`};
  try{const ref=await db.collection('products').add(np);np._docId=ref.id;}catch(e){np._docId=null;}
  products.unshift(np); renderAdminList(); selectAdminProduct(newId); switchTab('details');
  showToast('Nova peça criada!');
}

async function persistProduct(p) {
  try{const{_docId,...data}=p;if(_docId)await db.collection('products').doc(_docId).set(data);else{const ref=await db.collection('products').add(data);p._docId=ref.id;}}catch(e){console.warn('Erro Firestore',e);}
}

/* ══ CLOSE PICKERS ══ */
document.addEventListener('click',e=>{
  const adminPicker=document.getElementById('adminColorPicker');
  if(adminPicker&&!document.getElementById('adminPickerWrap')?.contains(e.target)) adminPicker.classList.remove('open');
});
document.getElementById('adminOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('adminOverlay'))closeAdmin();});

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

/* ══ FILTERS & NAV ══ */
function setNavActive(el) {
  document.querySelectorAll('nav a').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
}

document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(btn.dataset.cat ? { cat: btn.dataset.cat } : null);
  });
});
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => setNavActive(a));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal(); closeCart(); closeCheckout(); closeWishlist(); closeSearch();
    document.getElementById('adminOverlay').classList.remove('active');
    document.getElementById('adminWelcomeOverlay').classList.remove('active');
    document.querySelectorAll('.overlay-base.active').forEach(o => { o.classList.remove('active'); });
    document.body.style.overflow = '';
  }
});
// Fechar overlays de modal ao clicar no fundo
document.querySelectorAll('.overlay-base').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; } });
});

loadProducts();
loadTestimonials();

/* ══ SCROLL & NAV ══ */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function scrollToProducts() {
  const el = document.getElementById('productsGrid') || document.getElementById('categoriesSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ══ CATEGORY FILTERS (chamados pela nav e hero) ══ */
function applySort() {
  const sel = document.getElementById('sortSelect');
  currentSort = sel ? sel.value : '';
  renderGrid(currentFilter);
}
function filterCat(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderGrid({ cat });
  scrollToProducts();
}
function filterNewProducts() {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  renderGrid({ badge: 'new' });
  scrollToProducts();
}
function filterSaleProducts() {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  renderGrid({ badge: 'sale' });
  scrollToProducts();
}
function resetFilter() {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === ''));
  currentFilter = null;
  renderGrid(null);
}

/* ══ SEARCH ══ */
function openSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar) return;
  bar.classList.add('open');
  setTimeout(() => { const inp = document.getElementById('searchInput'); if (inp) inp.focus(); }, 100);
}
function closeSearch() {
  const bar = document.getElementById('searchBar');
  if (bar) bar.classList.remove('open');
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  hideSuggestions();
  renderGrid();
}
function handleSearch(val) {
  const q = val.trim();
  renderSuggestions(q);
  if (!q) { renderGrid(); return; }
  renderGrid({ q });
}
function renderSuggestions(q) {
  const box = document.getElementById('searchSuggestions');
  if (!box) return;
  if (!q) { hideSuggestions(); return; }
  const matches = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.cat.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6);
  if (!matches.length) { hideSuggestions(); return; }
  box.innerHTML = matches.map(p => {
    const thumb = p.media.length>0 && p.media[0].type==='image'
      ? `<img src="${p.media[0].src}" alt="" class="sug-thumb">`
      : `<div class="sug-thumb sug-thumb-svg">${p.svgPath||FALLBACK_DRESS_SVG}</div>`;
    return `<div class="suggestion-item" onclick="pickSuggestion(${p.id})">
      ${thumb}
      <div class="sug-info"><div class="sug-name">${p.name}</div><div class="sug-cat">${p.cat}</div></div>
      <div class="sug-price">${p.price}</div>
    </div>`;
  }).join('');
  box.style.display = 'block';
}
function hideSuggestions() {
  const box = document.getElementById('searchSuggestions');
  if (box) { box.innerHTML = ''; box.style.display = 'none'; }
}
function pickSuggestion(id) {
  hideSuggestions();
  closeSearch();
  openProduct(id);
}

/* ══ CAROUSEL ══ */
let _carouselIdx = 0;
function _initCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsEl = document.getElementById('carouselDots');
  if (!slides.length || !dotsEl) return;
  dotsEl.innerHTML = Array.from(slides).map((_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" onclick="carouselGo(${i})"></button>`
  ).join('');
  setInterval(() => carouselNext(), 5000);

  // Touch swipe support
  const track = document.querySelector('.hero-carousel');
  if (track) {
    let _touchStartX = 0;
    track.addEventListener('touchstart', e => { _touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _touchStartX;
      if (Math.abs(dx) > 40) dx < 0 ? carouselNext() : carouselPrev();
    }, { passive: true });
  }
}
function carouselGo(idx) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.carousel-dot');
  if (!slides.length) return;
  _carouselIdx = (idx + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle('active', i === _carouselIdx));
  dots.forEach((d, i)   => d.classList.toggle('active',   i === _carouselIdx));
}
function carouselNext() { carouselGo(_carouselIdx + 1); }
function carouselPrev() { carouselGo(_carouselIdx - 1); }

/* ══ UTILS: MAP & WHATSAPP ══ */
function openMap(query) {
  window.open('https://www.google.com/maps/search/' + encodeURIComponent(query), '_blank');
}
function openWhatsApp(msg) {
  const text = msg || 'Olá! Vim pelo site da Ton de Pele e gostaria de mais informações.';
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
}

/* ══ EXTRA MODALS ══ */
function openAbout() {
  const el = document.getElementById('aboutOverlay');
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function openReturns() {
  const el = document.getElementById('returnsOverlay');
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function openSizeGuideModal() {
  const el = document.getElementById('sizeGuideModal');
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* ══ ORDERS ADMIN ══ */
const ORDER_STATUS_LABELS = { novo:'Novo', confirmado:'Confirmado', enviado:'Enviado', entregue:'Entregue', cancelado:'Cancelado' };
const ORDER_STATUS_COLORS = { novo:'#c08060', confirmado:'#5a7a8a', enviado:'#8a6a9a', entregue:'#2e7d2e', cancelado:'#8b2e2e' };

async function loadAdminOrders() {
  const list = document.getElementById('adminOrdersList');
  const stats = document.getElementById('ordersStats');
  if (!list) return;
  list.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:1rem 0;">Carregando...</p>';
  try {
    const snap = await db.collection('orders').orderBy('createdAt','desc').limit(100).get();
    if (snap.empty) { list.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:1rem 0;">Nenhum pedido ainda.</p>'; stats.innerHTML=''; return; }
    const orders = snap.docs.map(d=>({_id:d.id,...d.data()}));
    // Stats
    const totalRev = orders.reduce((s,o)=>s+(o.total||0),0);
    const now = new Date(); const thisMonth = orders.filter(o=>{ if(!o.createdAt) return false; const d=o.createdAt.toDate(); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
    const monthRev = thisMonth.reduce((s,o)=>s+(o.total||0),0);
    stats.innerHTML = `
      <div class="orders-stat-card"><div class="orders-stat-num">${orders.length}</div><div class="orders-stat-label">Total de pedidos</div></div>
      <div class="orders-stat-card"><div class="orders-stat-num">R$ ${totalRev.toFixed(2).replace('.',',')}</div><div class="orders-stat-label">Faturamento total</div></div>
      <div class="orders-stat-card"><div class="orders-stat-num">${thisMonth.length}</div><div class="orders-stat-label">Pedidos este mês</div></div>
      <div class="orders-stat-card"><div class="orders-stat-num">R$ ${monthRev.toFixed(2).replace('.',',')}</div><div class="orders-stat-label">Receita este mês</div></div>`;
    // List
    list.innerHTML = orders.map(o => {
      const date = o.createdAt ? o.createdAt.toDate().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      const statusColor = ORDER_STATUS_COLORS[o.status] || '#888';
      const statusOpts = Object.entries(ORDER_STATUS_LABELS).map(([v,l])=>`<option value="${v}"${o.status===v?' selected':''}>${l}</option>`).join('');
      const itemsText = o.items ? o.items.map(i=>`${i.qty}× ${i.name} (${i.size})`).join(', ') : '—';
      return `<div class="admin-order-card">
        <div class="admin-order-head">
          <div>
            <strong style="font-size:13px;">${o.name||'—'}</strong>
            <span style="font-size:10px;color:var(--muted);margin-left:8px;">${date}</span>
          </div>
          <span class="order-status-badge" style="background:${statusColor};">${ORDER_STATUS_LABELS[o.status]||o.status}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin:4px 0;">${o.phone||''} ${o.email?'· '+o.email:''}</div>
        <div style="font-size:11px;margin:4px 0;">${itemsText}</div>
        <div style="font-size:11px;color:var(--muted);">${o.address||''} · ${o.payment||''}</div>
        ${o.coupon?`<div style="font-size:10px;color:#2e7d2e;margin-top:2px;">Cupom: ${o.coupon} (−R$ ${(o.discount||0).toFixed(2).replace('.',',')})</div>`:''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <strong style="font-size:14px;">R$ ${(o.total||0).toFixed(2).replace('.',',')}</strong>
          <div style="display:flex;align-items:center;gap:8px;">
            <select class="sort-select" style="font-size:10px;padding:5px 22px 5px 8px;" onchange="updateOrderStatus('${o._id}',this.value)">${statusOpts}</select>
            <button onclick="deleteOrder('${o._id}')" title="Remover pedido" style="background:none;border:1px solid rgba(139,46,46,0.35);cursor:pointer;color:#b85c5c;padding:5px 7px;display:flex;align-items:center;transition:all 0.2s;" onmouseover="this.style.background='rgba(139,46,46,0.08)'" onmouseout="this.style.background='none'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) { list.innerHTML = '<p style="font-size:12px;color:var(--muted);">Erro ao carregar pedidos.</p>'; }
}

async function updateOrderStatus(id, status) {
  try {
    await db.collection('orders').doc(id).update({ status });
    showToast('Status atualizado!');
  } catch(e) { showToast('Erro ao atualizar status.'); }
}

async function deleteOrder(id) {
  if (!confirm('Remover este pedido permanentemente?')) return;
  try {
    await db.collection('orders').doc(id).delete();
    showToast('Pedido removido.');
    loadAdminOrders();
  } catch(e) { showToast('Erro ao remover pedido.'); }
}

/* ══ TESTIMONIALS ══ */
const STAR_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const SEED_TESTIMONIALS = [
  { id:'t1', name:'Ana Paula',  location:'Maceió, AL',   text:'Qualidade incrível! A lingerie chegou super bem embalada e o tecido é ainda mais macio do que parecia nas fotos.' },
  { id:'t2', name:'Camila S.',  location:'Arapiraca, AL', text:'Já sou cliente há 3 anos. Sempre volto porque os modelos são lindos e o atendimento no WhatsApp é rápido demais!' },
  { id:'t3', name:'Juliana M.', location:'Recife, PE',   text:'O pijama de cetim é um sonho. Comprei para dar de presente e a pessoa amou. Com certeza vou voltar para comprar para mim!' }
];
let testimonials = [];

async function loadTestimonials() {
  try {
    const snap = await db.collection('testimonials').orderBy('order').get();
    testimonials = snap.empty ? SEED_TESTIMONIALS : snap.docs.map(d=>({id:d.id,...d.data()}));
  } catch(e) { testimonials = SEED_TESTIMONIALS; }
  renderTestimonials();
}

function renderTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;
  grid.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${STAR_SVG.repeat(5)}</div>
      <p>"${t.text}"</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.name.charAt(0).toUpperCase()}</div>
        <div><strong>${t.name}</strong><span>${t.location}</span></div>
      </div>
    </div>`).join('');
}

function renderAdminTestimonials() {
  const list = document.getElementById('adminTestimonialsList');
  if (!list) return;
  list.innerHTML = testimonials.map((t,i) => `
    <div class="admin-testimonial-item" data-id="${t.id}">
      <div class="admin-testimonial-meta"><strong>${t.name}</strong><span>${t.location}</span></div>
      <p style="font-size:11px;color:var(--muted);margin:4px 0 8px;">"${t.text.slice(0,80)}${t.text.length>80?'…':''}"</p>
      <div style="display:flex;gap:6px;">
        <button class="admin-save-btn" style="flex:1;font-size:10px;padding:7px 8px;" onclick="editTestimonial('${t.id}')">Editar</button>
        <button class="delete-product-btn" style="font-size:10px;padding:7px 10px;" onclick="deleteTestimonial('${t.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></button>
      </div>
    </div>`).join('') + `<button class="add-new-btn" style="margin-top:1rem;" onclick="editTestimonial(null)">+ Novo depoimento</button>`;
}

function editTestimonial(id) {
  const t = id ? testimonials.find(x=>x.id===id) : null;
  document.getElementById('tEditId').value   = id||'';
  document.getElementById('tEditName').value = t?.name||'';
  document.getElementById('tEditLoc').value  = t?.location||'';
  document.getElementById('tEditText').value = t?.text||'';
  document.getElementById('testimonialEditForm').style.display = 'block';
}

async function saveTestimonial() {
  const id   = document.getElementById('tEditId').value;
  const name = document.getElementById('tEditName').value.trim();
  const loc  = document.getElementById('tEditLoc').value.trim();
  const text = document.getElementById('tEditText').value.trim();
  if (!name||!text) { showToast('Preencha nome e depoimento!'); return; }
  const data = { name, location: loc, text, order: id ? (testimonials.find(x=>x.id===id)?.order||0) : testimonials.length };
  try {
    if (id) {
      await db.collection('testimonials').doc(id).set(data);
      const idx = testimonials.findIndex(x=>x.id===id);
      if (idx>-1) testimonials[idx] = { id, ...data };
    } else {
      const ref = await db.collection('testimonials').add(data);
      testimonials.push({ id: ref.id, ...data });
    }
  } catch(e) {
    // offline: update in-memory only
    if (id) { const idx=testimonials.findIndex(x=>x.id===id); if(idx>-1) testimonials[idx]={id,...data}; }
    else { testimonials.push({ id: 't'+Date.now(), ...data }); }
  }
  document.getElementById('testimonialEditForm').style.display = 'none';
  renderTestimonials();
  renderAdminTestimonials();
  showToast('Depoimento salvo!');
}

async function deleteTestimonial(id) {
  if (!confirm('Remover este depoimento?')) return;
  try { await db.collection('testimonials').doc(id).delete(); } catch(e) {}
  testimonials = testimonials.filter(t=>t.id!==id);
  renderTestimonials();
  renderAdminTestimonials();
  showToast('Depoimento removido.');
}

/* ══ INIT CAROUSEL ON LOAD ══ */
document.addEventListener('DOMContentLoaded', () => { _initCarousel(); initReveal(); });



/* ══ MOBILE MENU ══ */
function toggleMobileMenu() {
  const overlay = document.getElementById('mobileNavOverlay');
  const drawer  = document.getElementById('mobileNavDrawer');
  if (!overlay || !drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) { closeMobileMenu(); } else {
    overlay.classList.add('active');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeMobileMenu() {
  const overlay = document.getElementById('mobileNavOverlay');
  const drawer  = document.getElementById('mobileNavDrawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('active');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}
/* ══ REVEAL ON SCROLL ══ */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  // Observa novos cards quando renderizados
  const observerConfig = { childList: true };
  const gridObserver = new MutationObserver(() => {
    document.querySelectorAll('.card:not(.reveal)').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  });
  
  const grid = document.getElementById('productsGrid');
  if (grid) gridObserver.observe(grid, observerConfig);

  document.querySelectorAll('.reveal, section').forEach(el => observer.observe(el));
}
