file_path = 'src/pages/PublicRegister.css'
with open(file_path, 'r') as f:
    content = f.read()

# Find and replace the loader CSS section
old_loader_start = '/* Full Page Loader */'
old_loader_end = 'margin: 0;\n}'

# Find the positions
start_pos = content.find(old_loader_start)
end_pos = content.find(old_loader_end, start_pos)

if start_pos != -1 and end_pos != -1:
    # Keep everything before the loader
    before = content[:start_pos]
    # Keep everything after the loader (including the closing brace)
    after = content[end_pos + len('margin: 0;\n}'):]
    
    # New professional loader CSS
    new_loader = '''/* Full Page Loader - Professional Design */
.full-page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: loaderFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes loaderFadeIn {
  from {
    opacity: 0;
                         (0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

.loader-content {
  text-align: center;
  color: white;
  padding: 4rem 3rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset    inset    inset    inset    inset  order: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 520px;
  min-width: 400px;
  position: relative;  position: relative;  position: relative;  positio5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards;
}

@keyframes contentSlideUp {
  from {
    opacity: 0;
                    la                 .95);
  }
  to {
    op    op    op  tr    op    op   at    op    op    op  tr    op    op   at    op    op    op  tr    op    op   at    op    op    op    position: absolute;
  top: -50%;
  left: -50%;
                      t: 200%;
  background: linear  background: li5d  background: linear  background: li5d  background: linear spare  background: linear  bammer 3s infinite;
}

@keyframes shimmer {
  0% {
    transf  m: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: t    transform: t    sl    transform:at    transform: t    ad    transform: t    t 80px;
  height: 80px;
  margin: 0 auto 2rem;
  position: relative;
  animation: spinnerBounce  animation: spinnerBounce  animation: spinnerBounce  animation: spinnerBounce  animatioe(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Outer rotating ring */
.loader-spinner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  heighr: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff      borr-  border-top-color: #fff      borr-  border-top-color: #fff      borr-  border-top-color: #fff      borr-  border-top-color: #fff      borr-  border-top-colootate(0deg);
  }
  100% {
                                 }
}

/* Inner rotating ring */
.loader-spinner::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-bottom-col  :   borde border-left-color: #fff;
  border-radius: 50%;
  animation: spinInner 1s cubic-bezier(0.5, 0, 0.5, 1) inf  animation: s
}

@keyframes spinInner @keyframes spinInnerrm@keyframes spinInner @keyframes spinInnerrm@keyframes spinInner @keyframes spinInnerrm@keyframes spinInner @keyframes ht: 80@keyfrargin-bottom: 1rem;
  color:   fffff;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  animation: te  animat2s  animatiout infinite;
  p  p  p  p  p  iv  p  p  p  p  p  iv  p  p  p  p  p  iv  p  p 0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.loader-content p {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  line-height: 1.6;
  text-shadow: 0 1px 10px rgba  , 0, 0, 0.2);
  position: relative;
  z-index: 1;
  font-weight: 500;
}

/* Cricket ball animation (decorative) */
.loader-spinner-ball {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transf  transf  transf  transf  transf  transf  transf  tranpx rgba(255, 255, 255, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.3);
  animation: ballPulse 1.5s ease-in-out infinite;
}

@keyframes ballPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 
      0 0 0 4px rgba(255, 255, 255, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 
      0 0      0 0      0 0      0 0      0 0      0 0 0px rgba(0, 0, 0, 0.4);
  }
}

/* Responsive design */
@media (max-width: 768@media (max-wir-@mntent {
    min-width: auto;
    max-width: 90%;
    pad    pad    pad    pa m    pad    pad    pad    pa m    pntent h2 {
                      
  }
  
  .loader-content p {
    font-size: 1re    font-size: 1re  sp    font-sizwi    font-size: 1reght:     font-size: 1re    font-size: 1re  spnt    font-size: 1re   ader
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print('✅ Updated loader CSS     print('sional design!')
else:
    print('❌ Could not find loader section')
