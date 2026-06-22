// ============================================================
// CSInterface.js - Adobe CEP HTML-ExtendScript Bridge
// CEP 6+ için: __adobe_cep__.evalScript(script, callback)
// Fallback: sıralı kuyruk + event listener
// ============================================================

var cepExtensionId = "com.shapeanimator.panel";

function CSInterface() {
    this.extensionId = cepExtensionId;
    this._queue = [];
    this._ready = true;
    
    var self = this;
    
    // CEP event listener - callback mekanizması çalışmazsa yedek
    if (typeof window.__adobe_cep__ !== "undefined") {
        try {
            window.__adobe_cep__.addEventListener("com.adobe.csxs.events.ResultReceived", function(event) {
                if (self._queue.length > 0) {
                    var item = self._queue.shift();
                    var data = (event && typeof event.data === "string") ? event.data : "";
                    if (item && item.callback) {
                        item.callback(data);
                    }
                }
            });
        } catch (e) {
            // Event listener desteklenmiyorsa sessizce geç
        }
    }
}

CSInterface.prototype.evalScript = function(script, callback) {
    // CEP ortamı yoksa
    if (typeof window.__adobe_cep__ === "undefined") {
        if (callback) callback(JSON.stringify({ error: "After Effects bağlantısı yok" }));
        return;
    }
    
    var self = this;
    var called = false;
    var fallbackTimer = null;
    
    // Tek seferlik callback wrapper
    function done(result) {
        if (called) return;
        called = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (callback) callback(result != null ? String(result) : "");
    }
    
    // Yöntem 1: Direkt callback parametresi (CEP 6+)
    try {
        window.__adobe_cep__.evalScript(script, function(result) {
            done(result);
        });
    } catch (e) {
        // Bu yöntem çalışmazsa kuyruğa ekleyip dene
        self._queue.push({ callback: done });
        try {
            window.__adobe_cep__.evalScript(script);
        } catch (e2) {
            self._queue.pop();
            done(JSON.stringify({ error: "CEP evalScript hatası: " + e2.toString() }));
        }
    }
    
    // 8 saniye timeout - hiçbir yöntem çalışmazsa
    fallbackTimer = setTimeout(function() {
        done(JSON.stringify({ error: "After Effects yanıt vermedi. AE açık mı?" }));
    }, 8000);
};

CSInterface.prototype.addEventListener = function(event, callback) {
    if (typeof window.__adobe_cep__ !== "undefined") {
        try {
            window.__adobe_cep__.addEventListener(event, callback);
        } catch (e) {}
    }
};

CSInterface.prototype.getSystemPath = function(pathType) {
    try {
        if (typeof window.__adobe_cep__ !== "undefined") {
            return window.__adobe_cep__.getSystemPath(pathType);
        }
    } catch (e) {}
    return "";
};

// Auto-initialize
var csInterface = new CSInterface();
