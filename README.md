# Saveur 🍽

**Tu guía gastronómica personal** — Guarda restaurantes, bares y cafés, filtra por tipo, ordena por distancia o precio, y obtén información de sitios directamente desde internet.

---

## 📁 Estructura del proyecto

```
saveur-app/
├── www/                        ← Toda la web app (HTML + CSS + JS)
│   ├── index.html              ← Punto de entrada
│   ├── manifest.json           ← PWA manifest
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── db.js               ← IndexedDB (almacenamiento local)
│       ├── geo.js              ← GPS y geocodificación
│       ├── api.js              ← Búsqueda online (OpenStreetMap)
│       ├── ui.js               ← Renderizado de componentes
│       └── app.js              ← Lógica principal
├── capacitor.config.json       ← Config de Capacitor (APK)
├── package.json
└── .github/
    └── workflows/
        └── build-apk.yml       ← CI/CD para generar el APK
```

---

## 🚀 Cómo subir a GitHub y generar el APK

### 1. Crear el repositorio en GitHub
1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `saveur-app` (o el que prefieras)
3. Visibilidad: **Privado** o Público
4. **NO** marques "Add README" (ya viene uno)
5. Clic en **Create repository**

### 2. Subir los archivos

Con Git desde terminal:
```bash
cd saveur-app
git init
git add .
git commit -m "Initial commit: Saveur app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/saveur-app.git
git push -u origin main
```

O arrastrando archivos desde la web de GitHub (botón "Add file → Upload files").

### 3. El APK se genera automáticamente

Al hacer push a `main`, GitHub Actions lanzará el workflow `build-apk.yml`.
- Ve a tu repo → pestaña **Actions**
- Espera a que termine (≈ 5-10 min)
- En "Artifacts" descarga `saveur-debug-apk.zip` → dentro estará el `.apk`

### 4. Instalar el APK en Android
1. Transfiere el `.apk` a tu móvil (por cable, Google Drive, etc.)
2. En el móvil: **Ajustes → Seguridad → Instalar apps de fuentes desconocidas** (actívalo)
3. Abre el `.apk` y pulsa Instalar

---

## ✨ Funcionalidades

| Función | Descripción |
|---|---|
| **Categorías** | Café, Copas, Almuerzo, Cena, Brunch |
| **Tipo de cocina** | Española, Italiana, Japonesa, Mediterránea... |
| **Estado** | Por visitar / Visitado |
| **Ordenar** | Por fecha, precio, valoración, distancia |
| **GPS** | Ordena por cercanía usando tu ubicación real |
| **Dirección manual** | Introduce dirección + geocodificación automática |
| **Búsqueda online** | Obtiene horarios, teléfono, web, extras desde OSM |
| **Foto** | Cámara del móvil o galería |
| **Valoración** | Estrellas 1-5 |
| **Notas privadas** | Solo las ves tú |
| **Opinión** | Tu reseña pública |
| **Precio medio** | €/persona con indicador €/€€/€€€/€€€€ |
| **Mapa** | Vista de todos tus lugares en Leaflet/OSM |
| **Estadísticas** | Totales, gráficos por categoría y precio |
| **Almacenamiento** | IndexedDB — funciona offline |
| **Cómo llegar** | Abre Google Maps con direcciones |

---

## 🔧 Desarrollar localmente

Para probar en el navegador, sirve la carpeta `www/` con cualquier servidor local:

```bash
# Python
cd www && python3 -m http.server 8080

# Node
npx serve www
```

Abre `http://localhost:8080`

---

## 📝 Notas

- La búsqueda online usa **OpenStreetMap/Nominatim** — gratuita, sin API key. Puede no encontrar todos los locales (especialmente los más nuevos).
- El APK generado es **debug** (no firmado para producción). Para publicar en Play Store necesitarías firmarlo con un keystore.
- Los datos se guardan localmente en el dispositivo con **IndexedDB** (persisten aunque cierres la app).
