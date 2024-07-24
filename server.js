const http = require('http');
const qrgenModule = require('facturacionelectronicapy-qrgen');
const qrgen = qrgenModule.default || qrgenModule;
const fs = require('fs');
const path = require('path');
const { eventLogger, errorLogger } = require('./logger');
const xmlParser = require('xml-js');

const PORT = 3003;
const outputFolderPath = path.join(__dirname, 'output');

// Crear la carpeta 'output' si no existe
if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
}

// Función para preprocesar el archivo XML firmado
async function preprocessXML(xmlContent) {
    return xmlContent.replace(/&#xD;/g, '').replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><');
}

// Función para postprocesar el archivo XML generado
async function postprocessXML(xmlContent) {
    return xmlContent.replace(/&#xD;/g, '').replace(/\r?\n|\r/g, '').replace(/>\s+</g, '><');
}

// Función para generar el código QR
async function generateQRCode(xmlFilePath) {
    try {
        // Leer el archivo XML
        let xmlSigned = await fs.promises.readFile(xmlFilePath, 'utf8');
        eventLogger.info('XML leído correctamente desde el archivo');

        // Preprocesar antes de generar el QR
        xmlSigned = await preprocessXML(xmlSigned);

        // Verificar si la función de generación de QR está disponible
        if (typeof qrgen.generateQR !== 'function') {
            throw new Error("generateQR no es una función disponible en qrgen");
        }

        // Generar el XML con QR
        let xmlWithQR = await qrgen.generateQR(xmlSigned);
        eventLogger.info('QR XML generado');

        // Postprocesar después de generar el QR
        xmlWithQR = await postprocessXML(xmlWithQR);

        // Parsear el string XML para obtener el valor del atributo Id en <DE>
        const xmlDoc = xmlParser.xml2js(xmlWithQR, { compact: true });
        let idValue;

        if (xmlDoc.rDE && xmlDoc.rDE.DE && xmlDoc.rDE.DE._attributes && xmlDoc.rDE.DE._attributes.Id) {
            idValue = xmlDoc.rDE.DE._attributes.Id;
        } else {
            throw new Error('Missing Id attribute in the <DE> element of the XML');
        }

        // Construir el nombre del archivo usando Id
        const filename = `signed-qr-${idValue}.xml`;

        // Guardar el XML con QR generado en la carpeta output con el nombre generado
        const filePath = path.join(outputFolderPath, filename);
        await fs.promises.writeFile(filePath, xmlWithQR);

        // Mostrar el XML generado por consola
        console.log("XML con QR generado guardado:", filePath);

        // Devolver el nombre del archivo
        return filename;

    } catch (err) {
        errorLogger.error('Error en la generación de QR:', err);
        throw err;
    }
}

// Manejador de solicitudes HTTP
const requestHandler = async (req, res) => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                const xmlFilePath = requestData.xmlFilePath;

                const filename = await generateQRCode(xmlFilePath);

                // Responder con el nombre del archivo generado
                const response = { filename: filename };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response, null, 2));

            } catch (error) {
                errorLogger.error('Error procesando la solicitud:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error procesando la solicitud', message: error.message }));
            }
        });

    } else {
        errorLogger.error('Solicitud incorrecta recibida');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Solo se aceptan solicitudes POST con contenido JSON' }));
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, (err) => {
    if (err) {
        errorLogger.error(`Error al iniciar el servidor: ${err.message}`);
        return console.error('Error al iniciar el servidor:', err);
    }
    eventLogger.info(`Servidor iniciado en http://localhost:${PORT}`);
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
