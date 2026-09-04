document.querySelectorAll('a[href^="#"]').forEach(link=>{link.addEventListener('click',event=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth'});}})});

const getSessionId=()=>{let id=localStorage.getItem('shedlr_session_id');if(!id){id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`);localStorage.setItem('shedlr_session_id',id);}return id;};
const sessionId=getSessionId();
const track=(eventName,metadata={})=>fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({event_name:eventName,page_path:location.pathname+location.search,session_id:sessionId,referrer:document.referrer||'',metadata})}).catch(()=>{});
track('page_view',{title:document.title,referrer:document.referrer||''});

/* ── Category & lead type pre-select from URL param ── */
(function(){
  const params=new URLSearchParams(window.location.search);
  const cat=params.get('category');
  if(cat){
    const select=document.getElementById('category');
    if(select)select.value=cat;
  }
  const type=params.get('type');
  if(type){
    const typeSelect=document.getElementById('leadType');
    if(typeSelect)typeSelect.value=type;
  }
})();

/* ── ZIP code availability checker (always reports available) ── */
(function(){
  const zipInput=document.getElementById('zip');
  const checkBtn=document.getElementById('zipCheckBtn');
  const result=document.getElementById('zipResult');
  if(!zipInput||!result)return;
  let checkedZip='';

  const runCheck=()=>{
    const zip=zipInput.value.trim();
    if(!zip){
      result.hidden=false;
      result.className='zip-result info';
      result.textContent="No ZIP? No problem — leave it blank and we'll send leads from any area we service.";
      return;
    }
    if(!/^\d{5}$/.test(zip)){
      result.hidden=false;
      result.className='zip-result';
      result.textContent='Please enter a valid 5-digit ZIP code.';
      return;
    }
    if(checkedZip===zip&&!result.hidden&&result.classList.contains('available'))return;
    track('zip_check_started',{zip});
    result.hidden=false;
    result.className='zip-result checking';
    result.innerHTML='<span class="zip-spinner"></span> Checking availability for '+zip+'…';
    if(checkBtn)checkBtn.disabled=true;
    setTimeout(()=>{
      checkedZip=zip;
      result.className='zip-result available';
      result.innerHTML='<span class="zip-check">✓</span> Good news — Shedlr is currently serving '+zip+'!';
      if(checkBtn)checkBtn.disabled=false;
      track('zip_check_available',{zip});
    },1100+Math.random()*500);
  };

  if(checkBtn)checkBtn.addEventListener('click',runCheck);
  zipInput.addEventListener('input',()=>{
    zipInput.value=zipInput.value.replace(/\D/g,'').slice(0,5);
    if(zipInput.value.length===0){result.hidden=true;return;}
    if(zipInput.value.length===5)runCheck();
  });
})();

/* ── Custom quantity toggle + live total ── */
(function(){
  const qtySelect=document.getElementById('quantity');
  const customLabel=document.getElementById('customQtyLabel');
  const customInput=document.getElementById('customQty');
  const liveTotal=document.getElementById('liveTotal');
  const liveTotalAmount=document.getElementById('liveTotalAmount');
  const liveTotalDetail=document.getElementById('liveTotalDetail');
  const categorySelect=document.getElementById('category');

  const getQty=()=>{
    if(qtySelect&&qtySelect.value&&qtySelect.value!=='custom'){
      return parseInt(qtySelect.value,10);
    }else if(qtySelect&&qtySelect.value==='custom'&&customInput&&customInput.value){
      return parseInt(customInput.value,10)||0;
    }
    return 0;
  };

  const updateLiveTotal=()=>{
    const qty=getQty();
    const cat=categorySelect?categorySelect.value:'';
    const pricePerLead=getCategoryPrice(cat);
    if(liveTotal){
      if(qty>0){
        liveTotal.hidden=false;
        if(liveTotalAmount)liveTotalAmount.textContent='$'+(qty*pricePerLead);
        if(liveTotalDetail)liveTotalDetail.textContent=qty+' leads × $'+pricePerLead+' each';
      }else{
        liveTotal.hidden=true;
      }
    }
  };

  if(qtySelect){
    qtySelect.addEventListener('change',()=>{
      if(qtySelect.value==='custom'){
        if(customLabel)customLabel.style.display='block';
        if(customInput){customInput.style.display='block';customInput.required=true;}
      }else{
        if(customLabel)customLabel.style.display='none';
        if(customInput){customInput.style.display='none';customInput.required=false;}
      }
      updateLiveTotal();
    });
  }
  if(customInput){
    customInput.addEventListener('input',updateLiveTotal);
  }
  if(categorySelect){
    categorySelect.addEventListener('change',updateLiveTotal);
  }

  /* Pre-select qty from URL param */
  const params=new URLSearchParams(window.location.search);
  const urlQty=params.get('qty');
  if(urlQty&&qtySelect){
    const n=parseInt(urlQty,10);
    const options=Array.from(qtySelect.options).map(o=>o.value);
    if(options.includes(String(n))){
      qtySelect.value=String(n);
    }else if(n>0){
      qtySelect.value='custom';
      if(customLabel)customLabel.style.display='block';
      if(customInput){customInput.style.display='block';customInput.required=true;customInput.value=n;}
    }
    updateLiveTotal();
  }
})();

/* ── Stripe Payment Link ── */
const STRIPE_PAYMENT_LINK='https://buy.stripe.com/4gMcN5g4lbmKdUOe2Qak003';

/* ── Order form submission ── */
const orderForm=document.querySelector('[data-order-form]');
if(orderForm){
  orderForm.addEventListener('submit',async event=>{
    event.preventDefault();
    track('order_submit_attempt');
    const message=document.querySelector('[data-form-message]');
    const paymentNextStep=document.querySelector('[data-payment-next-step]');
    const button=orderForm.querySelector('button[type="submit"]');
    const originalText=button.textContent;
    message.hidden=false;
    message.textContent='Submitting your order...';
    if(paymentNextStep){paymentNextStep.hidden=true;}
    button.disabled=true;
    button.textContent='Submitting...';

    try{
      const formData=Object.fromEntries(new FormData(orderForm).entries());
      const payload={
        name:formData.name,
        email:formData.email,
        phone:formData.phone,
        company:formData.company,
        category:formData.category,
        lead_type:formData.lead_type,
        zip:formData.zip,
        quantity:0,
        message:formData.message,
        page_path:location.pathname+location.search,
        session_id:sessionId
      };

      const response=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok){
        throw new Error(result.error||'We could not submit your order. Please try again.');
      }
      track('order_submitted',{category:payload.category,quantity:payload.quantity});
      message.textContent='Order received. Redirecting to secure payment...';
      message.classList.remove('error');
      orderForm.reset();
      /* Redirect to Stripe payment after short delay */
      setTimeout(()=>{window.location.href=STRIPE_PAYMENT_LINK;},1500);
    }catch(error){
      track('order_submit_error',{message:error.message||'Unknown error'});
      message.textContent=error.message||'We could not submit your order. Please call (307) 303-7530 or email support@shedlr.com.';
      message.classList.add('error');
    }finally{
      button.disabled=false;
      button.textContent=originalText;
    }
  });
}

/* ── Scroll reveal animation ── */
(function(){
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.12,rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
})();

/* ── Stat counter animation ── */
(function(){
  const counters=document.querySelectorAll('.stat-counter');
  if(!counters.length)return;
  const animateCounter=(el)=>{
    const target=parseInt(el.dataset.target||'0',10);
    const prefix=el.dataset.prefix||'';
    const suffix=el.dataset.suffix||'';
    if(target===0){el.textContent=prefix+'0'+suffix;return;}
    let current=0;
    const steps=30;
    const increment=target/steps;
    const timer=setInterval(()=>{
      current+=increment;
      if(current>=target){
        el.textContent=prefix+target+suffix;
        clearInterval(timer);
      }else{
        el.textContent=prefix+Math.ceil(current)+suffix;
      }
    },25);
  };
  const counterObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.5});
  counters.forEach(el=>counterObserver.observe(el));
})();

/* ── Lead category pricing map ── */
const LEAD_PRICES={
  'Personal Trainer':4,
  'Life Coach':1,
  'Maintenance':5,
  'Dog Walker':2,
  'House Cleaning':6,
  'Landscaping':7,
  'Tutoring':4,
  'Photography':8,
  'Handyman':5,
  'Moving Services':9,
  'Catering':7,
  'Event Planning':10,
  'Home Insurance':1,
  'Vehicle Insurance':1,
  'Roofing':3,
  'Auto Hail Damage':12,
  'Home Services':6,
  'HVAC':7,
  'Plumbing':7,
  'Pest Control':5,
  'Solar':10,
  'Real Estate':8
};
/* Slug → price for contact form values */
const LEAD_PRICE_SLUGS={
  'personal-trainer':4,
  'life-coach':1,
  'maintenance':5,
  'dog-walker':2,
  'house-cleaning':6,
  'landscaping':7,
  'tutoring':4,
  'photography':8,
  'handyman':5,
  'moving':9,
  'catering':7,
  'event-planning':10,
  'home-insurance':1,
  'vehicle-insurance':1,
  'roofing':3,
  'auto-hail-damage':12,
  'home-services':6,
  'hvac':7,
  'plumbing':7,
  'pest-control':5,
  'solar':10,
  'real-estate':8
};
const getCategoryPrice=(cat)=>{
  if(!cat)return 5;
  if(LEAD_PRICES[cat]!==undefined)return LEAD_PRICES[cat];
  if(LEAD_PRICE_SLUGS[cat]!==undefined)return LEAD_PRICE_SLUGS[cat];
  /* Try data-price attribute on selected option */
  const sel=document.getElementById('category');
  if(sel&&sel.selectedOptions[0]){
    const p=parseInt(sel.selectedOptions[0].dataset.price||'5',10);
    return p;
  }
  return 5;
};

/* ── Price calculator ── */
(function(){
  const qtySlider=document.getElementById('calcQty');
  const qtyDisplay=document.getElementById('calcQtyDisplay');
  const totalDisplay=document.getElementById('calcTotal');
  const breakdownDisplay=document.getElementById('calcBreakdown');
  const orderBtn=document.getElementById('calcOrderBtn');
  const categorySelect=document.getElementById('calcCategory');
  if(!qtySlider)return;

  const updateCalc=()=>{
    const qty=parseInt(qtySlider.value,10);
    const category=categorySelect?categorySelect.value:'';
    const pricePerLead=getCategoryPrice(category);
    const total=qty*pricePerLead;
    if(qtyDisplay)qtyDisplay.textContent=qty;
    if(totalDisplay)totalDisplay.textContent='$'+total;
    if(breakdownDisplay)breakdownDisplay.textContent=qty+' leads × $'+pricePerLead+' each';
    if(orderBtn){
      const catSlug=category.toLowerCase().replace(/\s+/g,'-');
      orderBtn.href='contact.html?category='+encodeURIComponent(catSlug)+'&qty='+qty;
    }
  };

  qtySlider.addEventListener('input',updateCalc);
  if(categorySelect)categorySelect.addEventListener('change',updateCalc);

  /* Pre-select from URL params */
  const params=new URLSearchParams(window.location.search);
  const urlQty=params.get('qty');
  if(urlQty){
    const n=Math.max(5,Math.min(500,parseInt(urlQty,10)||50));
    qtySlider.value=n;
  }
  updateCalc();
})();

/* ── Password visibility toggle ── */
(function(){
  document.querySelectorAll('input[type="password"]').forEach(input=>{
    const wrapper=document.createElement('div');
    wrapper.className='password-field';
    input.parentNode.insertBefore(wrapper,input);
    wrapper.appendChild(input);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='password-toggle';
    toggle.innerHTML='◉';
    toggle.setAttribute('aria-label','Show or hide password');
    toggle.addEventListener('click',()=>{
      if(input.type==='password'){input.type='text';toggle.innerHTML='◍';}else{input.type='password';toggle.innerHTML='◉';}
    });
    wrapper.appendChild(toggle);
  });
})();

/* ── Shedlr LLC legal-name footer update ── */
(function(){
  const oldText='© 2026 Shedlr. Operated by LifeRise Unlimited Corporation.';
  const newText='© 2026 Shedlr LLC. Operated by LifeRise Unlimited Corporation.';
  document.querySelectorAll('.copyright p').forEach(el=>{
    if(el.textContent.trim()===oldText)el.textContent=newText;
  });
})();
