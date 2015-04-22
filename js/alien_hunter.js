var AlienHunter = {};

AlienHunter.initialize = function(alienCount) {
  //Setup three.js WebGL renderer
  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.setPixelRatio(window.devicePixelRatio);

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild(this.renderer.domElement);

  // Create a three.js scene.
  this.scene = new THREE.Scene();

  // Create a three.js camera.
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.3, 10000);
  this.camera.position.z = 3;

  // Apply VR headset positional data to camera.
  this.controls = new THREE.VRControls(this.camera);

  // Apply VR stereo rendering to renderer.
  this.effect = new THREE.VREffect(this.renderer);
  this.effect.setSize(window.innerWidth, window.innerHeight);

  // Create a VR manager helper to enter and exit VR mode.
  this.manager = new WebVRManager(this.renderer, this.effect);

  this.alienMeshes = [];
  if(!alienCount) { alienCount = 5; }
  for(var i = 0;i<alienCount;i++) {
    this.alienMeshes.push(new Alien().build());
  }

  this.alienMeshes.forEach(function(alien) {
    this.scene.add(alien);
  }.bind(this));

  var ambientLight = new THREE.AmbientLight(0xbbbbbb);
  this.scene.add(ambientLight);

  this.raycaster = new THREE.Raycaster();

  this.animate = function() {
    var coords = new THREE.Vector2();
    coords.x = 0;
    coords.y = 0;
    this.raycaster.setFromCamera(coords, this.camera);
    var intersections = this.raycaster.intersectObjects(this.alienMeshes);
    if(intersections.length > 0){
      intersections.forEach(function(intersection) {
        // Modify intersected aliens 
        var mesh = intersection.object;
        var alien = mesh.alien;
        if(alien.isAlien) {
          mesh.position.z -= 0.01;
          alien.takeHit();
          if(alien.dead()) {
            var index = this.alienMeshes.indexOf(mesh);
            this.alienMeshes.splice(index, 1);
            this.scene.remove(mesh);
          }
        }
      }.bind(this));
    }

    var aliensRemaining = this.alienMeshes.some(function(mesh) {
      return mesh.alien.isAlien;
    });

    if(!aliensRemaining) {
      this.endGame();
    } else {
      // Update VR headset position and apply to camera.
      this.controls.update();

      // Render the scene through the manager.
      this.manager.render(this.scene, this.camera);

      requestAnimationFrame(this.animate.bind(this));
    }
  };

  this.endGame = function() {
    // Create a three.js scene.
    var endScene = new THREE.Scene();
    if(!this.textMesh) {
      var text = new THREE.TextGeometry('GAME OVER');
      text.computeBoundingBox();
      var material = new THREE.MeshNormalMaterial();
      this.textMesh = new THREE.Mesh(text, material);
      this.textMesh.position.x = -300;
      this.textMesh.position.y = 0;
      this.textMesh.position.z = -500;

      this.textMesh.rotation.x = 0;
      this.textMesh.rotation.y = Math.PI * 2;
    }

    var ambientLight = new THREE.AmbientLight(0xbbbbbb);
    endScene.add(ambientLight);
    endScene.add(this.textMesh);

    this.controls.update();
    this.manager.render(endScene, this.camera);

    requestAnimationFrame(this.endGame.bind(this));
  };

  this.animate();
};
