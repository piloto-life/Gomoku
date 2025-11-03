// Toggle de visibilidade da senha usando Material Icons
document.addEventListener('DOMContentLoaded', () => {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        // criar wrapper para posicionar o botão
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle';
        btn.style.position = 'absolute';
        btn.style.right = '10px';
        btn.style.top = '50%';
        btn.style.transform = 'translateY(-50%)';
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.padding = '0';
        btn.style.cursor = 'pointer';
        btn.innerHTML = '<i class="material-icons">visibility_off</i>';
        wrapper.appendChild(btn);

        // alterna visibilidade ao clicar
        btn.addEventListener('click', () => {
            if (field.type === 'password') {
                field.type = 'text';
                btn.innerHTML = '<i class="material-icons">visibility</i>';
            } else {
                field.type = 'password';
                btn.innerHTML = '<i class="material-icons">visibility_off</i>';
            }
        });

        // ao sair do campo, garantir que a senha volte a estar oculta
        field.addEventListener('blur', () => {
            field.type = 'password';
            btn.innerHTML = '<i class="material-icons">visibility_off</i>';
        });
    });
});