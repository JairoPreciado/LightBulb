// utils/guideImages.ts

const guideImages: { [key: string]: any[] } = {
  inicio: [require("../../assets/images/guide/inicio.png")], // tópico 1
  notificaciones: [require("../../assets/images/guide/notificaciones.jpg")], // tópico 6
  credenciales: [
    require("../../assets/images/guide/credenciales.png"), // tópico 2
    require("../../assets/images/guide/credenciales2.jpg"),
  ],
  listaDeDispositivos: [ // tópico 3
    require("../../assets/images/guide/listaDeDispositivos.png"),
    require("../../assets/images/guide/listaDeDispositivosModal.png"),
    require("../../assets/images/guide/listaDeDispositivosModalEditarNombre.png"),
    require("../../assets/images/guide/listaDeDispositivosModalEditarID.png"),
    require("../../assets/images/guide/listaDeDispositivosModalBorrar.png"),
  ],
  flasheoDeDispositivo: [ // tópico 5
    require("../../assets/images/guide/flasheoDeDispositivo.png"),
    require("../../assets/images/guide/flasheoDeDispositivo2.png"),
    require("../../assets/images/guide/flasheoDeDispositivo3.png"),
  ],
  gestionDeCuenta: [ // tópico 7
    require("../../assets/images/guide/gestionDeCuenta.png"),
    require("../../assets/images/guide/gestionDeCuenta2.png"),
    require("../../assets/images/guide/gestionDeCuenta3.png"),
    require("../../assets/images/guide/gestionDeCuenta4.png"),
  ],
  dispositivoSeleccionado: [ // tópico 9
    require("../../assets/images/guide/dispositivoSeleccionado.png"),
    require("../../assets/images/guide/dispositivoSeleccionado2.png"),
    require("../../assets/images/guide/dispositivoSeleccionado3.png"),
  ],
  dispositivoControlar: [require("../../assets/images/guide/dispositivoControlar.png")], // tópico 8
  dispositivoProgramarHorario: [ // tópico 4
    require("../../assets/images/guide/dispositivoProgramarHorario.png"),
    require("../../assets/images/guide/dispositivoProgramarHorario2.jpg"),
  ],
}

export default guideImages
