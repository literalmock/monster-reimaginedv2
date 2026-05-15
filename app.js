(function(){
let scene,camera,renderer,clock,canGroup,flameParticles,emberParticles,smokeParticles,mouseX=0,mouseY=0,targetMouseX=0,targetMouseY=0;

function init(){
    const container=document.getElementById('canvas-container');
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x000000);
    scene.fog=new THREE.FogExp2(0x000000,0.02);
    camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,1000);
    camera.position.set(0,0,8);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.2;
    container.appendChild(renderer.domElement);
    clock=new THREE.Clock();
    createLighting();
    createMonsterCan();
    createVolcanicEnvironment();
    createFlameSystem();
    createEmberSystem();
    createSmokeSystem();
    createEnergyWaves();
    window.addEventListener('resize',onWindowResize);
    document.addEventListener('mousemove',onMouseMove);
    setTimeout(()=>{document.getElementById('loadingScreen').classList.add('hidden')},2000);
    animate();
}

function createLighting(){
    scene.add(new THREE.AmbientLight(0x1a1a1a,0.5));
    const rimLight=new THREE.PointLight(0x39ff14,3,20);
    rimLight.position.set(-5,3,5);
    rimLight.castShadow=true;
    scene.add(rimLight);
    const volLight=new THREE.PointLight(0xff6600,2,15);
    volLight.position.set(5,-2,3);
    volLight.castShadow=true;
    scene.add(volLight);
    const topLight=new THREE.SpotLight(0x39ff14,2);
    topLight.position.set(0,10,5);
    topLight.angle=Math.PI/4;
    topLight.penumbra=0.5;
    scene.add(topLight);
    scene.add(new THREE.PointLight(0x00ff88,1.5,10));
    const flickerLights=[];
    for(let i=0;i<5;i++){
        const fl=new THREE.PointLight(0x39ff14,0.5,8);
        fl.position.set((Math.random()-0.5)*10,(Math.random()-0.5)*10,(Math.random()-0.5)*5);
        flickerLights.push(fl);
        scene.add(fl);
    }
    scene.userData.flickerLights=flickerLights;
}

function createMonsterCan(){
    canGroup=new THREE.Group();
    const canGeometry=new THREE.CylinderGeometry(0.7,0.7,2.2,64,8,true);
    const canMaterial=new THREE.ShaderMaterial({
        uniforms:{time:{value:0},greenColor:{value:new THREE.Color(0x39ff14)},blackColor:{value:new THREE.Color(0x0a0a0a)}},
        vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;uniform float time;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec3 pos=position;float breathe=sin(time*0.5)*0.002;pos.xy*=(1.0+breathe);vPosition=(modelViewMatrix*vec4(pos,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}',
        fragmentShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;uniform float time;uniform vec3 greenColor;uniform vec3 blackColor;float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}float noise(vec2 st){vec2 i=floor(st);vec2 f=fract(st);float a=random(i);float b=random(i+vec2(1.0,0.0));float c=random(i+vec2(0.0,1.0));float d=random(i+vec2(1.0,1.0));vec2 u=f*f*(3.0-2.0*f);return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;}void main(){vec3 viewDir=normalize(-vPosition);vec3 normal=normalize(vNormal);float fresnel=pow(1.0-dot(viewDir,normal),3.0);float clawPattern=0.0;float uvY=vUv.y*3.0;float wave1=sin(vUv.x*20.0+uvY*3.0)*0.5+0.5;float wave2=sin(vUv.x*15.0-uvY*2.0+1.0)*0.5+0.5;clawPattern=max(wave1,wave2);vec3 baseColor=mix(blackColor,greenColor*0.3,clawPattern*0.5);float specular=pow(max(dot(reflect(-viewDir,normal),viewDir),0.0),32.0);vec3 highlight=vec3(0.8,0.9,0.8)*specular*2.0;float emissiveIntensity=0.2+0.1*sin(time*2.0);vec3 emissive=greenColor*emissiveIntensity*clawPattern;float droplets=step(0.97,noise(vUv*50.0+time*0.1));vec3 dropletHighlight=vec3(0.9)*droplets*0.5;float rim=fresnel*(0.5+0.5*clawPattern);vec3 rimColor=greenColor*rim*0.8;vec3 finalColor=baseColor+highlight+emissive+dropletHighlight+rimColor;finalColor+=fresnel*greenColor*0.3;gl_FragColor=vec4(finalColor,1.0);}',
        side:THREE.DoubleSide
    });
    const canMesh=new THREE.Mesh(canGeometry,canMaterial);
    canMesh.castShadow=true;
    canMesh.receiveShadow=true;
    canGroup.add(canMesh);
    const topCapGeometry=new THREE.CylinderGeometry(0.68,0.68,0.15,64);
    const capMaterial=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.9,roughness:0.2});
    const topCap=new THREE.Mesh(topCapGeometry,capMaterial);
    topCap.position.y=1.175;
    canGroup.add(topCap);
    const bottomCap=new THREE.Mesh(topCapGeometry,capMaterial);
    bottomCap.position.y=-1.175;
    canGroup.add(bottomCap);
    const tabGeometry=new THREE.TorusGeometry(0.15,0.02,16,32);
    const tabMaterial=new THREE.MeshStandardMaterial({color:0x333333,metalness:0.95,roughness:0.1});
    const tab=new THREE.Mesh(tabGeometry,tabMaterial);
    tab.position.set(0,1.25,0.3);
    tab.rotation.x=Math.PI/2;
    canGroup.add(tab);
    const logoGeometry=new THREE.RingGeometry(0.5,0.55,64);
    const logoMaterial=new THREE.ShaderMaterial({
        uniforms:{time:{value:0},glowColor:{value:new THREE.Color(0x39ff14)}},
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 glowColor;void main(){float pulse=0.5+0.5*sin(time*3.0);float alpha=0.6+0.4*pulse;gl_FragColor=vec4(glowColor,alpha);}',
        transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false
    });
    const logoRing=new THREE.Mesh(logoGeometry,logoMaterial);
    logoRing.position.z=0.71;
    logoRing.rotation.y=Math.PI;
    canGroup.add(logoRing);
    scene.add(canGroup);
    scene.userData.canMaterial=canMaterial;
    scene.userData.logoMaterial=logoMaterial;
}

function createVolcanicEnvironment(){
    const handGroup=new THREE.Group();
    const palmGeometry=new THREE.DodecahedronGeometry(3,2);
    const rockMaterial=new THREE.ShaderMaterial({
        uniforms:{time:{value:0},lavaColor:{value:new THREE.Color(0xff4400)},rockColor:{value:new THREE.Color(0x0a0a0a)}},
        vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;uniform float time;void main(){vUv=uv;vNormal=normal;vec3 pos=position;vPosition=(modelViewMatrix*vec4(pos,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}',
        fragmentShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;uniform float time;uniform vec3 lavaColor;uniform vec3 rockColor;float noise(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}void main(){vec3 viewDir=normalize(-vPosition);float fresnel=pow(1.0-dot(viewDir,vNormal),2.0);float n=noise(vPosition*3.0);float cracks=step(0.7,noise(vPosition*5.0+time*0.2));vec3 lavaGlow=lavaColor*cracks*(0.5+0.5*sin(time*2.0));vec3 baseColor=mix(rockColor,rockColor*1.5,n*0.3);baseColor+=lavaGlow;baseColor+=fresnel*lavaColor*0.3;gl_FragColor=vec4(baseColor,1.0);}',
        side:THREE.DoubleSide
    });
    const palm=new THREE.Mesh(palmGeometry,rockMaterial);
    palm.position.set(2,-3,-2);
    palm.scale.set(1,0.5,0.8);
    palm.rotation.set(0.3,-0.5,0.2);
    handGroup.add(palm);
    for(let i=0;i<5;i++){
        const fingerGeometry=new THREE.CapsuleGeometry(0.3-i*0.04,2.5,8,16);
        const finger=new THREE.Mesh(fingerGeometry,rockMaterial);
        const angle=-0.3+i*0.15;
        finger.position.set(3.5+i*0.3,-2+Math.sin(angle)*1.5,-1+Math.cos(angle)*0.5);
        finger.rotation.set(0.5,-0.3+i*0.1,angle*2);
        handGroup.add(finger);
    }
    scene.add(handGroup);
    scene.userData.handGroup=handGroup;
    const volcanoGeometry=new THREE.ConeGeometry(15,20,8,1,true);
    const volcanoMaterial=new THREE.ShaderMaterial({
        uniforms:{time:{value:0}},
        vertexShader:'varying vec2 vUv;varying vec3 vPosition;uniform float time;void main(){vUv=uv;vec3 pos=position;pos.y+=sin(pos.x*0.5+time)*0.2+cos(pos.z*0.3+time*0.8)*0.15;vPosition=(modelViewMatrix*vec4(pos,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}',
        fragmentShader:'varying vec3 vPosition;uniform float time;float noise(vec2 st){return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453);}void main(){float n=noise(vPosition.xy*0.5);vec3 darkRock=vec3(0.05,0.02,0.02);vec3 lavaOrange=vec3(1.0,0.3,0.0);vec3 fireYellow=vec3(1.0,0.6,0.1);float lavaFlow=sin(vPosition.y*0.5-time*2.0)*0.5+0.5;lavaFlow*=step(0.6,n);vec3 color=mix(darkRock,lavaOrange,lavaFlow*0.5);color=mix(color,fireYellow,lavaFlow*0.2);float edgeGlow=smoothstep(0.0,0.3,vPosition.y*0.1+0.5)*smoothstep(1.0,0.7,vPosition.y*0.1+0.5);color+=lavaOrange*edgeGlow*0.3;gl_FragColor=vec4(color,1.0);}',
        transparent:true,opacity:0.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
    });
    const volcano=new THREE.Mesh(volcanoGeometry,volcanoMaterial);
    volcano.position.set(0,-8,-15);
    volcano.scale.set(1.5,1,1.5);
    scene.add(volcano);
    scene.userData.volcanoMaterial=volcanoMaterial;
}

function createFlameSystem(){
    const flameCount=500;
    const flameGeometry=new THREE.BufferGeometry();
    const positions=new Float32Array(flameCount*3);
    const colors=new Float32Array(flameCount*3);
    const sizes=new Float32Array(flameCount);
    const velocities=new Float32Array(flameCount*3);
    const phases=new Float32Array(flameCount);
    for(let i=0;i<flameCount;i++){
        const i3=i*3;
        positions[i3]=(Math.random()-0.5)*12;
        positions[i3+1]=Math.random()*8-4;
        positions[i3+2]=(Math.random()-0.5)*8-5;
        const colorChoice=Math.random();
        if(colorChoice>0.7){colors[i3]=1.0;colors[i3+1]=0.8;colors[i3+2]=0.2;}
        else if(colorChoice>0.4){colors[i3]=1.0;colors[i3+1]=0.4;colors[i3+2]=0.0;}
        else{colors[i3]=0.8;colors[i3+1]=0.1;colors[i3+2]=0.0;}
        sizes[i]=Math.random()*0.3+0.1;
        velocities[i3]=(Math.random()-0.5)*0.02;
        velocities[i3+1]=Math.random()*0.05+0.02;
        velocities[i3+2]=(Math.random()-0.5)*0.02;
        phases[i]=Math.random()*Math.PI*2;
    }
    flameGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    flameGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    flameGeometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    flameParticles=new THREE.Points(flameGeometry,new THREE.ShaderMaterial({
        uniforms:{time:{value:0},pointTexture:{value:createCircleTexture()}},
        vertexShader:'attribute float size;attribute vec3 color;attribute float phase;uniform float time;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vec3 pos=position;pos.x+=sin(time*3.0+phase)*0.1;pos.z+=cos(time*2.5+phase)*0.1;vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);gl_Position=projectionMatrix*mvPosition;gl_PointSize=size*(300.0/-mvPosition.z);vAlpha=0.6+0.4*sin(time*5.0+phase);}',
        fragmentShader:'uniform sampler2D pointTexture;varying vec3 vColor;varying float vAlpha;void main(){vec4 texColor=texture2D(pointTexture,gl_PointCoord);gl_FragColor=vec4(vColor,vAlpha*texColor.a);}',
        transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,vertexColors:true
    }));
    flameParticles.userData.velocities=velocities;
    flameParticles.userData.phases=phases;
    scene.add(flameParticles);
    scene.userData.flameParticles=flameParticles;
}

function createEmberSystem(){
    const emberCount=300;
    const emberGeometry=new THREE.BufferGeometry();
    const positions=new Float32Array(emberCount*3);
    const colors=new Float32Array(emberCount*3);
    const sizes=new Float32Array(emberCount);
    const speeds=new Float32Array(emberCount);
    for(let i=0;i<emberCount;i++){
        const i3=i*3;
        positions[i3]=(Math.random()-0.5)*20;
        positions[i3+1]=Math.random()*15-5;
        positions[i3+2]=(Math.random()-0.5)*15-5;
        colors[i3]=1.0;colors[i3+1]=0.5+Math.random()*0.5;colors[i3+2]=0.1;
        sizes[i]=Math.random()*0.05+0.02;
        speeds[i]=Math.random()*0.5+0.5;
    }
    emberGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    emberGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    emberGeometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    emberParticles=new THREE.Points(emberGeometry,new THREE.ShaderMaterial({
        uniforms:{time:{value:0}},
        vertexShader:'attribute float size;attribute vec3 color;uniform float time;varying vec3 vColor;void main(){vColor=color;vec3 pos=position;pos.y+=sin(time*2.0+pos.x)*0.02;vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);gl_Position=projectionMatrix*mvPosition;gl_PointSize=size*(300.0/-mvPosition.z);}',
        fragmentShader:'varying vec3 vColor;void main(){float dist=length(gl_PointCoord-vec2(0.5));float alpha=1.0-smoothstep(0.3,0.5,dist);gl_FragColor=vec4(vColor,alpha*0.8);}',
        transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,vertexColors:true
    }));
    emberParticles.userData.speeds=speeds;
    scene.add(emberParticles);
    scene.userData.emberParticles=emberParticles;
}

function createSmokeSystem(){
    const smokeCount=200;
    const smokeGeometry=new THREE.BufferGeometry();
    const positions=new Float32Array(smokeCount*3);
    const sizes=new Float32Array(smokeCount);
    const phases=new Float32Array(smokeCount);
    for(let i=0;i<smokeCount;i++){
        const i3=i*3;
        positions[i3]=(Math.random()-0.5)*15;
        positions[i3+1]=Math.random()*10-3;
        positions[i3+2]=(Math.random()-0.5)*10-8;
        sizes[i]=Math.random()*1.5+0.5;
        phases[i]=Math.random()*Math.PI*2;
    }
    smokeGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    smokeGeometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    smokeParticles=new THREE.Points(smokeGeometry,new THREE.ShaderMaterial({
        uniforms:{time:{value:0},smokeColor:{value:new THREE.Color(0x1a1a1a)}},
        vertexShader:'attribute float size;attribute float phase;uniform float time;varying float vAlpha;void main(){vec3 pos=position;pos.x+=sin(time*0.5+phase)*0.2;pos.y+=cos(time*0.3+phase)*0.1;pos.z+=sin(time*0.4+phase)*0.15;vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);gl_Position=projectionMatrix*mvPosition;gl_PointSize=size*(300.0/-mvPosition.z);vAlpha=0.1+0.1*sin(time+phase);}',
        fragmentShader:'uniform vec3 smokeColor;varying float vAlpha;void main(){float dist=length(gl_PointCoord-vec2(0.5));float alpha=(1.0-smoothstep(0.2,0.5,dist))*vAlpha;gl_FragColor=vec4(smokeColor,alpha);}',
        transparent:true,blending:THREE.NormalBlending,depthWrite:false
    }));
    smokeParticles.userData.phases=phases;
    scene.add(smokeParticles);
    scene.userData.smokeParticles=smokeParticles;
}

function createEnergyWaves(){
    const waveCount=5;
    const waves=[];
    for(let w=0;w<waveCount;w++){
        const waveGeometry=new THREE.TorusGeometry(3+w*0.5,0.02,16,128);
        const waveMaterial=new THREE.ShaderMaterial({
            uniforms:{time:{value:0},waveColor:{value:new THREE.Color(0x39ff14)},offset:{value:w*0.5}},
            vertexShader:'varying vec2 vUv;uniform float time;uniform float offset;void main(){vUv=uv;vec3 pos=position;float wave=sin(uv.x*32.0+time*2.0+offset)*0.1;pos.y+=wave;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}',
            fragmentShader:'uniform vec3 waveColor;uniform float time;uniform float offset;varying vec2 vUv;void main(){float pulse=0.5+0.5*sin(time*3.0+offset);float alpha=0.3+0.3*pulse;gl_FragColor=vec4(waveColor,alpha);}',
            transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide
        });
        const wave=new THREE.Mesh(waveGeometry,waveMaterial);
        wave.position.z=-3-w*0.3;
        wave.rotation.x=Math.PI/2;
        wave.rotation.y=Math.random()*Math.PI;
        waves.push(wave);
        scene.add(wave);
    }
    scene.userData.energyWaves=waves;
}

function createCircleTexture(){
    const canvas=document.createElement('canvas');
    canvas.width=64;canvas.height=64;
    const ctx=canvas.getContext('2d');
    const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(255,255,255,1)');
    gradient.addColorStop(0.5,'rgba(255,255,255,0.5)');
    gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
}

function onMouseMove(event){
    targetMouseX=(event.clientX/window.innerWidth)*2-1;
    targetMouseY=-(event.clientY/window.innerHeight)*2+1;
}

function onWindowResize(){
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
}

function animate(){
    requestAnimationFrame(animate);
    const elapsedTime=clock.getElapsedTime();
    mouseX+=(targetMouseX-mouseX)*0.05;
    mouseY+=(targetMouseY-mouseY)*0.05;
    if(scene.userData.canMaterial)scene.userData.canMaterial.uniforms.time.value=elapsedTime;
    if(scene.userData.logoMaterial)scene.userData.logoMaterial.uniforms.time.value=elapsedTime;
    if(canGroup){
        canGroup.position.y=Math.sin(elapsedTime*0.8)*0.1;
        canGroup.position.x=Math.sin(elapsedTime*0.5)*0.05;
        canGroup.rotation.y=Math.sin(elapsedTime*0.3)*0.1+mouseX*0.2;
        canGroup.rotation.x=Math.cos(elapsedTime*0.4)*0.05+mouseY*0.1;
        canGroup.rotation.z=Math.sin(elapsedTime*0.6)*0.03;
        canGroup.rotation.y+=0.002;
    }
    if(flameParticles){
        flameParticles.material.uniforms.time.value=elapsedTime;
        const positions=flameParticles.geometry.attributes.position.array;
        const velocities=flameParticles.userData.velocities;
        for(let i=0;i<positions.length/3;i++){
            const i3=i*3;
            positions[i3]+=velocities[i3];
            positions[i3+1]+=velocities[i3+1];
            positions[i3+2]+=velocities[i3+2];
            if(positions[i3+1]>6){
                positions[i3+1]=-4;
                positions[i3]=(Math.random()-0.5)*12;
                positions[i3+2]=(Math.random()-0.5)*8-5;
            }
        }
        flameParticles.geometry.attributes.position.needsUpdate=true;
    }
    if(emberParticles){
        emberParticles.material.uniforms.time.value=elapsedTime;
        const positions=emberParticles.geometry.attributes.position.array;
        const speeds=emberParticles.userData.speeds;
        for(let i=0;i<positions.length/3;i++){
            const i3=i*3;
            positions[i3]+=Math.sin(elapsedTime+i)*0.01;
            positions[i3+1]+=speeds[i]*0.02;
            if(positions[i3+1]>10){
                positions[i3+1]=-5;
                positions[i3]=(Math.random()-0.5)*20;
            }
        }
        emberParticles.geometry.attributes.position.needsUpdate=true;
    }
    if(smokeParticles)smokeParticles.material.uniforms.time.value=elapsedTime;
    if(scene.userData.energyWaves){
        scene.userData.energyWaves.forEach((wave,index)=>{
            wave.material.uniforms.time.value=elapsedTime;
            wave.rotation.z+=0.005*(index%2===0?1:-1);
        });
    }
    if(scene.userData.volcanoMaterial)scene.userData.volcanoMaterial.uniforms.time.value=elapsedTime;
    if(scene.userData.flickerLights){
        scene.userData.flickerLights.forEach((light,i)=>{
            light.intensity=0.3+Math.sin(elapsedTime*(3+i*0.5))*0.3;
        });
    }
    if(scene.userData.handGroup){
        scene.userData.handGroup.position.y=Math.sin(elapsedTime*0.3)*0.05;
        scene.userData.handGroup.rotation.z=Math.sin(elapsedTime*0.2)*0.02;
    }
    camera.position.x=Math.sin(elapsedTime*0.2)*0.2;
    camera.position.y=Math.cos(elapsedTime*0.15)*0.1;
    camera.lookAt(mouseX*0.3,mouseY*0.2,0);
    renderer.render(scene,camera);
}

document.addEventListener('DOMContentLoaded',init);
})();
