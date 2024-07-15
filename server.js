const http = require('http');
const qrgenModule = require('facturacionelectronicapy-qrgen');
const qrgen = qrgenModule.default || qrgenModule;
const fs = require('fs');
const path = require('path');
const { eventLogger, errorLogger } = require('./logger'); // Importamos los loggers desde logger.js
const xmlParser = require('xml-js'); // Asegúrate de tener esta dependencia instalada

const PORT = 3003;
const outputFolderPath = path.join(__dirname, 'output');

// Asegúrate de que la carpeta 'output' exista
if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
}

console.log(`Servidor iniciado en http://localhost:${PORT}`);

const requestHandler = (req, res) => {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            const xmlFilePath = requestData.xmlFilePath;

            fs.readFile(xmlFilePath, 'utf8', (err, xmlSigned) => {
                if (err) {
                    const errorMessage = 'Error reading XML file';
                    errorLogger.error(errorMessage, { error: err });
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: errorMessage }));
                    return;
                }

                eventLogger.info('XML leído correctamente desde el archivo');

                if (typeof qrgen.generateQR === 'function') {
                    qrgen.generateQR(xmlSigned)
                        .then(xmlConQR => {
                            eventLogger.info('QR XML generado');
                            eventLogger.info(`QR XML: ${xmlConQR}`);

                            // Parsear el string XML para obtener el valor del atributo Id en <DE>
                            const xmlDoc = xmlParser.xml2js(xmlConQR, { compact: true });
                            let idValue;

                            if (xmlDoc.rDE && xmlDoc.rDE.DE && xmlDoc.rDE.DE._attributes && xmlDoc.rDE.DE._attributes.Id) {
                                idValue = xmlDoc.rDE.DE._attributes.Id;
                            } else {
                                const errorMessage = 'Missing Id attribute in the <DE> element of the XML';
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: errorMessage }));
                                errorLogger.error(errorMessage);
                                return;
                            }

                            // Construir el nombre del archivo usando Id
                            const filename = `signed-qr-${idValue}.xml`; // Ejemplo: "signed-qr-01022197575001001000000122022081410002983981.xml"

                            // Guardar el XML con QR generado en la carpeta output con el nombre generado
                            const filePath = path.join(outputFolderPath, filename);
                            fs.writeFile(filePath, xmlConQR, (err) => {
                                if (err) {
                                    const errorMessage = 'Error saving XML';
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ error: errorMessage }));
                                    errorLogger.error(errorMessage, { error: err });
                                    return;
                                }

                                // Mostrar el XML generado por consola
                                console.log("XML con QR generado guardado:", filePath);

                                const response = {
                                    filename: filename
                                };
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(response, null, 2));
                            });
                        })
                        .catch(error => {
                            errorLogger.error('Error al generar XML con QR:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Error al generar XML con QR', message: error.message }));
                        });
                } else {
                    errorLogger.error("generateQR no es una función disponible en qrgen");
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Error interno del servidor' }));
                }
            });
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
    eventLogger.info(`Servidor escuchando en el puerto ${PORT}`);
});
