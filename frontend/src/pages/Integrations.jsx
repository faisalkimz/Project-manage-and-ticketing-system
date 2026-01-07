import { useState } from 'react';
import { Github, Slack, Gitlab, Trello, Check, ExternalLink } from 'lucide-react';

const Integrations = () => {
    const [connected, setConnected] = useState(['github']); // Fake state for demo

    const tools = [
        { id: 'github', name: 'GitHub', icon: <Github size={24} />, desc: 'Sync issues and commits.' },
        { id: 'gitlab', name: 'GitLab', icon: <Gitlab size={24} />, desc: 'DevOps lifecycle tool.' },
        { id: 'slack', name: 'Slack', icon: <Slack size={24} />, desc: 'Receive notifications in channels.' },
        { id: 'jira', name: 'Jira Software', icon: <Trello size={24} />, desc: 'Import issues from Jira.' },
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#172B4D]">Integrations</h1>
                <p className="text-[#5E6C84] mt-1">Connect with your favorite tools to supercharge your workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map(tool => (
                    <div key={tool.id} className="bg-white p-6 rounded-lg border border-[#DFE1E6] hover:shadow-md transition-shadow flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-[#F4F5F7] rounded flex items-center justify-center text-[#172B4D]">
                                {tool.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#172B4D] text-lg">{tool.name}</h3>
                                <p className="text-sm text-[#5E6C84] mt-1">{tool.desc}</p>
                            </div>
                        </div>
                        <button
                            className={`px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 ${connected.includes(tool.id) ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#EBECF0] text-[#172B4D] hover:bg-[#DFE1E6]'}`}
                        >
                            {connected.includes(tool.id) ? <><Check size={16} /> Connected</> : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 bg-[#DEEBFF] rounded-lg border border-[#B3D4FF]">
                <h3 className="font-bold text-[#0747A6] flex items-center gap-2">
                    <ExternalLink size={20} /> Developer API
                </h3>
                <p className="text-[#172B4D] mt-2 text-sm">
                    Want to build custom integrations? Access our REST API documentation to create webhooks and custom workflows.
                </p>
                <div className="mt-4">
                    <button className="px-4 py-2 bg-[#0052CC] text-white rounded font-bold text-sm hover:bg-[#0065FF]">
                        View API Docs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Integrations;
