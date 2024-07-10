# cmXmlQr (Generador de Qr a un Xml firmado)

Este repositorio contiene una extensión para la generacion de codigos Qr para los archivos XML firmados necesarios para la comunicación con la SET (Subsecretaría de Estado de Tributación del Ministerio de Hacienda) de Paraguay. El código está diseñado para generar codigos qr a las estructuras xml firmadas anteriormente generadas.

## Requerimientos

Para utilizar este código, es necesario tener instalado:

- Node.js
- npm (Node Package Manager)

## Instalación

Para instalar las dependencias necesarias, ejecute el siguiente comando en la terminal:

```bash
npm install facturacionelectronicapy-qrgen
```
```bash
npm install http
```
```bash
npm install winston
```

## Configuración

Antes de ejecutar el servidor, asegúrese de configurar adecuadamente los parámetros y datos necesarios según la documentación de la SET. Los datos del archivo XML deve de cumplir con los requisitos necesarios para poder generarle el qr, hay mas informacion sobre la generacion de archivos XML en este repositorio [cmXmlSing](https://github.com/PxSxtrxw/cmXmlSing).

## Uso

### Ejecución del Servidor

Para iniciar el servidor de desarrollo, use el siguiente comando:

```bash
node server
```
El servidor se iniciará en http://localhost:3002.

## Logger

el servidor guardara la actividad de errores en `error.log` y la informacion de toda la actividad del servidor en `info.log`

## Funcionamiento del Servidor HTTP
Al momento de ejecutar el archivo `server.js` se creara un servidor que estara escuchando una estructura XML anteriormente firmada como parametro en una solicitud POST y el servidor le dara una estructura XML con codigo Qr integrado


