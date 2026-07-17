(function () {
  var wrap = document.getElementById('ascii-wrap');
  var photo = document.getElementById('ascii-photo');
  if (!wrap || !photo) return;

  function brush(clientX, clientY) {
    var r = wrap.getBoundingClientRect();
    photo.style.setProperty('--mx', (clientX - r.left) + 'px');
    photo.style.setProperty('--my', (clientY - r.top) + 'px');
    photo.style.setProperty('--r', '90px');
  }

  function hide() {
    photo.style.setProperty('--r', '0px');
  }

  function onTouch(e) {
    e.preventDefault();
    brush(e.touches[0].clientX, e.touches[0].clientY);
  }

  wrap.addEventListener('mousemove', function (e) {
    brush(e.clientX, e.clientY);
  });
  wrap.addEventListener('mouseleave', hide);

  wrap.addEventListener('touchstart', onTouch, { passive: false });
  wrap.addEventListener('touchmove', onTouch, { passive: false });
  wrap.addEventListener('touchend', hide);
  wrap.addEventListener('touchcancel', hide);
})();
