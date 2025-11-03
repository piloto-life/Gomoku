function mostrarMenu(menuId) {
  event.stopPropagation();
  document.getElementById(menuId).classList.toggle("show");
}

// Compatibilidade: função sem parâmetros usada pelo HTML
function myFunction() {
  const el = document.getElementById('myDropdown');
  if (el) el.classList.toggle('show');
}
  
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}