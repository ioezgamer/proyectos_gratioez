import React from 'react';
import { clearDatabase } from '../services/db';
import { DatabaseIcon, DownloadIcon, UploadIcon, TrashIcon } from './icons';
import initSqlJs from 'sql.js';

interface DatabaseManagerProps {
  onReload: () => Promise<void>;
  disabled: boolean;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ onReload, disabled }) => {
  const handleClearDatabase = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todos los datos del torneo? Esta acción no se puede deshacer.')) {
      try {
        await clearDatabase();
        await onReload();
        alert('Base de datos limpiada correctamente. El torneo ha sido reiniciado.');
      } catch (error) {
        console.error('Error al limpiar la base de datos:', error);
        alert('Ocurrió un error al limpiar la base de datos.');
      }
    }
  };

  const handleExportDatabase = () => {
    try {
      // Obtener los datos guardados del localStorage
      const savedData = localStorage.getItem('tournamentData');
      
      if (!savedData) {
        alert('No hay datos para exportar.');
        return;
      }
      
      // Crear un blob con los datos
      const blob = new Blob([savedData], { type: 'application/octet-stream' });
      
      // Crear un enlace de descarga
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'tournament_backup.dat';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar el objeto URL
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error al exportar la base de datos:', error);
      alert('Ocurrió un error al exportar los datos.');
    }
  };

  return (
    <div className="bg-brand-secondary p-6 rounded-xl shadow-lg mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <DatabaseIcon className="w-5 h-5 text-brand-gold" />
        <h2 className="text-2xl font-bold text-brand-gold">Gestión de Datos</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExportDatabase}
          disabled={disabled}
          className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Exportar Datos</span>
        </button>
        
        <label
          className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white cursor-pointer`}
        >
          <UploadIcon className="w-5 h-5" />
          <span>Importar Datos</span>
          <input 
            type="file" 
            accept=".dat"
            className="hidden" 
            disabled={disabled}
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    if (event.target?.result) {
                      // Guardar los datos en localStorage
                      localStorage.setItem('tournamentData', event.target.result.toString());
                      
                      // Recargar los datos
                      await onReload();
                      
                      alert('Datos importados correctamente.');
                    }
                  } catch (error) {
                    console.error('Error al procesar el archivo:', error);
                    alert('Error al procesar el archivo importado.');
                  }
                };
                reader.readAsText(file);
              } catch (error) {
                console.error('Error al importar datos:', error);
                alert('Ocurrió un error al importar los datos.');
              }
            }}
          />
        </label>
        
        <button
          onClick={handleClearDatabase}
          disabled={disabled}
          className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${disabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white`}
        >
          <TrashIcon className="w-5 h-5" />
          <span>Reiniciar Torneo</span>
        </button>
      </div>
      
      <p className="text-sm text-gray-400 mt-4">
        * La exportación guarda todos los datos del torneo. El reinicio elimina todos los datos permanentemente.
      </p>
    </div>
  );
};

export default DatabaseManager;