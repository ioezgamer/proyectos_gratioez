
import React, { useState } from 'react';
import { PlusIcon } from './icons';

interface ParticipantFormProps {
    onAddParticipant: (name: string, school: string) => void;
    disabled: boolean;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ onAddParticipant, disabled }) => {
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && school.trim()) {
            onAddParticipant(name.trim(), school.trim());
            setName('');
            setSchool('');
        }
    };

    if (disabled) {
        return (
            <div className="bg-brand-accent p-4 rounded-lg text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-400">El registro de participantes está cerrado. El torneo ha comenzado.</h2>
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 text-brand-gold">Añadir Participante</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="col-span-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Magnus Carlsen"
                        className="w-full px-3 py-2 bg-brand-accent rounded-md border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        required
                    />
                </div>
                <div className="col-span-1">
                    <label htmlFor="school" className="block text-sm font-medium text-gray-300 mb-1">Escuela / Comunidad</label>
                    <input
                        id="school"
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="Ej: Club de Ajedrez de Noruega"
                        className="w-full px-3 py-2 bg-brand-accent rounded-md border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        required
                    />
                </div>
                <div className="col-span-1">
                    <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-brand-gold hover:opacity-90 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Añadir</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ParticipantForm;
