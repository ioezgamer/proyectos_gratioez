
import React from 'react';
import { Participant } from '../types';

interface ParticipantListProps {
    participants: Participant[];
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-brand-gold">Lista de Participantes ({participants.length})</h2>
            {participants.length === 0 ? (
                 <p className="text-gray-400">Aún no hay participantes registrados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-brand-accent">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Escuela / Comunidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((p, index) => (
                                <tr key={p.id} className="border-b border-brand-accent last:border-b-0 hover:bg-brand-accent transition-colors">
                                    <td className="p-3 font-semibold">{index + 1}</td>
                                    <td className="p-3">{p.name}</td>
                                    <td className="p-3 text-gray-400">{p.school}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ParticipantList;
