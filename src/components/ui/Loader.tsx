
import React from 'react';
import './Loader.css';

interface LoaderProps {
    text?: string;
    size?: 'small' | 'medium' | 'large';
}

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading', size = 'medium' }) => {
    return (
        <div className={`loader-container ${size}`}>
            <div className="loader-spinner"></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
};
