'use client';

import ChatWidget from '@/components/ChatWidget';

export default function WidgetPage() {
    return (
        <div style={{
            width: '100%',
            height: '100vh',
            backgroundColor: 'transparent',
        }}>
            <ChatWidget
                position="bottom-right"
                primaryColor="#8B5A2B"
                accentColor="#D4A574"
            />
        </div>
    );
}
