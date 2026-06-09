import { SUPPORTED_MODELS } from '../types/transcription';
import type { ModelId } from '../types/transcription';
import './ModelSelector.css';

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  disabled: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <span className="model-selector-heading" id="model-selector-title">מודל תמלול</span>

      <div
        className={`model-selector-options${disabled ? ' model-selector-options--disabled' : ''}`}
        role="radiogroup"
        aria-labelledby="model-selector-title"
      >
        {SUPPORTED_MODELS.map((m) => (
          <label
            key={m.id}
            className={[
              'model-option',
              selectedModel === m.id ? 'model-option--selected' : '',
            ].filter(Boolean).join(' ')}
          >
            <input
              type="radio"
              name="whisper-model"
              value={m.id}
              checked={selectedModel === m.id}
              onChange={() => onModelChange(m.id)}
              disabled={disabled}
              className="model-option-radio"
            />
            <span className="model-option-label">{m.label}</span>
            <span className="model-option-size">{m.size}</span>
          </label>
        ))}
      </div>

      <p className="model-selector-note">
        המודל מורד לדפדפן בפעם הראשונה ונשמר לשימוש עתידי.
        המודל הגדול (244MB) עשוי לקחת כמה דקות ועלול להתקשות במכשירים ישנים.
      </p>
    </div>
  );
}
