import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type PageHeaderProps = {
    primaryTitle: string;
    secondaryTitle: string;
    caption?: string;
};

export default function PageHeader({ primaryTitle, secondaryTitle, caption }: PageHeaderProps) {
    return (
        <Animated.View entering={FadeInDown.duration(420)} style={s.wrap}>
            <View style={s.titleRow}>
                <Text style={s.primary}>{primaryTitle} </Text>
                <Text style={s.secondary}>{secondaryTitle}</Text>
            </View>
            {caption ? <Text style={s.caption}>{caption}</Text> : null}
        </Animated.View>
    );
}

const s = StyleSheet.create({
    wrap: { gap: 4 },
    titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
    primary: { color: '#f1f5f9', fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
    secondary: { color: '#3b82f6', fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
    caption: { color: '#64748b', fontSize: 13, lineHeight: 19 },
});
