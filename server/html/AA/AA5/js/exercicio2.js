function tratadorDeCliqueExercicio2() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    alert(`Horário: ${hours} ${ampm} : ${minutes}m : ${seconds}s`);
    console.log('adicionar código na função tratadorDeCliqueExercicio2() em ./js/exercicio2.js')
}