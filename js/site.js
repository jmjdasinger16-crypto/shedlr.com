document.querySelectorAll('a[href^="#"]').forEach(link=>{link.addEventListener('click',event=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth'});}})});

const getSessionId=()=>{let id=localStorage.getItem('shedlr_session_id');if(!id){id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`);localStorage.setItem('shedlr_session_id',id);}return id;};
const sessionId=getSessionId();
const track=(eventName,metadata={})=>fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({event_name:eventName,page_path:location.pathname+location.search,session_id:sessionId,metadata})}).catch(()=>{});
track('page_view',{title:document.title,referrer:document.referrer||''});

/* ── Category pre-select from URL param ── */
(function(){
  const params=new URLSearchParams(window.location.search);
  const cat=params.get('category');
  if(cat){
    const select=document.getElementById('category');
    if(select)select.value=cat;
  }
})();

/* ── Custom quantity toggle ── */
(function(){
  const qtySelect=document.getElementById('quantity');
  const customLabel=document.getElementById('customQtyLabel');
  const customInput=document.getElementById('customQty');
  if(qtySelect){
    qtySelect.addEventListener('change',()=>{
      if(qtySelect.value==='custom'){
        if(customLabel)customLabel.style.display='block';
        if(customInput)customInput.style.display='block';
        if(customInput)customInput.required=true;
      }else{
        if(customLabel)customLabel.style.display='none';
        if(customInput){customInput.style.display='none';customInput.required=false;}
      }
    });
  }
})();

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
        quantity:formData.quantity==='custom'?Number(formData.custom_quantity):Number(formData.quantity),
        message:formData.message,
        page_path:location.pathname+location.search,
        session_id:sessionId
      };

      const response=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok){
        throw new Error(result.error||'We could not submit your order. Please try again.');
      }
      message.textContent=result.message||'Thank you. Your order has been received. You will get a payment link by email shortly.';
      if(paymentNextStep){paymentNextStep.hidden=false;}
      orderForm.reset();
      track('order_submitted',{category:payload.category,quantity:payload.quantity});
    }catch(error){
      track('order_submit_error',{message:error.message||'Unknown error'});
      message.textContent=error.message||'We could not submit your order. Please call (307) 303-7530 or email support@liferise.cc.';
    }finally{
      button.disabled=false;
      button.textContent=originalText;
    }
  });
}
