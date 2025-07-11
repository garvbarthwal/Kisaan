import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setVoiceSettings } from '../redux/slices/aiSlice';
import { FaCog, FaTimes, FaVolumeUp, FaMicrophone, FaWaveSquare } from 'react-icons/fa';

const VoiceSettingsModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { voiceSettings } = useSelector((state) => state.ai);
    const [localSettings, setLocalSettings] = useState(voiceSettings);

    const handleSave = () => {
        dispatch(setVoiceSettings(localSettings));
        onClose();
    };

    const handleReset = () => {
        const defaultSettings = {
            autoSpeak: true,
            autoSendOnVoiceEnd: true,
            speechRate: 0.9,
            speechPitch: 1,
            speechVolume: 0.8,
            enableVoiceAutoSend: true,
            voiceEndDelay: 1500,
            enableVoiceFeedback: true
        };
        setLocalSettings(defaultSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg flex items-center">
                        <FaCog className="mr-2 text-green-500" />
                        Voice Settings
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Auto Speak Response */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FaVolumeUp className="text-blue-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Auto Speak Response
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Automatically speak AI responses
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.autoSpeak}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    autoSpeak: e.target.checked
                                }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Auto Send on Voice End */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FaMicrophone className="text-red-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Auto Send on Voice End
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Automatically send message after speaking
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.autoSendOnVoiceEnd}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    autoSendOnVoiceEnd: e.target.checked
                                }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Voice End Delay */}
                    {localSettings.autoSendOnVoiceEnd && (
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                            <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                Auto-Send Delay
                                <span className="text-xs text-gray-500">{(localSettings.voiceEndDelay / 1000).toFixed(1)}s</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Time to wait after speech ends before sending
                            </p>
                            <input
                                type="range"
                                min="500"
                                max="3000"
                                step="100"
                                value={localSettings.voiceEndDelay || 1500}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    voiceEndDelay: parseInt(e.target.value)
                                }))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0.5s</span>
                                <span>3.0s</span>
                            </div>
                        </div>
                    )}

                    {/* Speech Rate */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                            Speech Rate
                            <span className="text-xs text-gray-500">{localSettings.speechRate.toFixed(1)}x</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={localSettings.speechRate}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                speechRate: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Slow</span>
                            <span>Fast</span>
                        </div>
                    </div>

                    {/* Speech Pitch */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                            Speech Pitch
                            <span className="text-xs text-gray-500">{localSettings.speechPitch.toFixed(1)}</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={localSettings.speechPitch}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                speechPitch: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    </div>

                    {/* Speech Volume */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                            Speech Volume
                            <span className="text-xs text-gray-500">{Math.round(localSettings.speechVolume * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={localSettings.speechVolume}
                            onChange={(e) => setLocalSettings(prev => ({
                                ...prev,
                                speechVolume: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Quiet</span>
                            <span>Loud</span>
                        </div>
                    </div>

                    {/* Voice Feedback */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FaWaveSquare className="text-purple-500 mr-3" />
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Visual Voice Feedback
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Show visual feedback while recording
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.enableVoiceFeedback}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    enableVoiceFeedback: e.target.checked
                                }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-between p-4 border-t">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Reset to Default
                    </button>
                    <div className="space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceSettingsModal;
