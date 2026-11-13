# Cesta

Aplicación de lista de la compra, disponible como interfaz web progresiva y como contenedor Android.

## Funciones

- Listas por supermercado.
- Añadir varios artículos en una sola entrada, cantidades y coste estimado.
- Marcado de productos comprados y progreso de la lista.
- Histórico de compras y tickets.

## Estructura

`web/` contiene la interfaz HTML, CSS y JavaScript. `app/` es el contenedor Android basado en WebView que sirve esos mismos recursos desde un origen local seguro y conserva el almacenamiento del dispositivo.

## Desarrollo

La interfaz puede abrirse desde `web/index.html`. Para Android, abre el proyecto con Android Studio o usa el wrapper Gradle incluido.
