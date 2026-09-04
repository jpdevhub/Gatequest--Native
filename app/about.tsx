import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Book, Heart, GithubLogo, DiscordLogo, Coffee, CaretDown, CaretUp,
} from 'phosphor-react-native';
import { useState } from 'react';

const FAQS = [
  {
    question: 'What is GATEQuest?',
    answer: 'GATEQuest is a free, open-source platform designed to help students prepare for the GATE exam. The goal is to provide high-quality PYQs in a modern, user-friendly interface.',
  },
  {
    question: 'Is the platform completely free?',
    answer: 'Yes, GATEQuest is and always will be free to use, provided as long as I can keep it free.',
  },
  {
    question: 'Will you put Ads?',
    answer: 'Nope, that will defeat the purpose of being distraction-free. If money ever becomes a problem, I will ask for donations upfront or close the project.',
  },
  {
    question: 'What is the source of questions?',
    answer: 'The source for questions is the GOPDF PYQs repository on GitHub (GATEOverflow/GO-PDFs).',
  },
  {
    question: 'Are all questions present in the app?',
    answer: 'Except for descriptive and out-of-syllabus questions, all are present (CS, DA, EC, EE, ME branches). Descriptive questions may be added in the future.',
  },
  {
    question: 'What if I find an error in a question?',
    answer: 'Most probably you will, since everything is done manually. Please report it through the app — it makes it better for everyone.',
  },
  {
    question: 'How can I contribute?',
    answer: 'Contributions are welcome! Start at the GitHub repository. You can also join the Discord community for discussions and feedback.',
  },
  {
    question: 'How does Smart Revision work?',
    answer: 'Smart Revision uses your incorrect answers and spaced repetition logic to resurface questions you need to review. It prioritises questions you got wrong recently.',
  },
];

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)} style={styles.faqItem}>
      <Pressable style={styles.faqHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.faqQuestion}>{question}</Text>
        {open
          ? <CaretUp size={16} color="#3b82f6" weight="bold" />
          : <CaretDown size={16} color="#64748b" weight="bold" />}
      </Pressable>
      {open && <Text style={styles.faqAnswer}>{answer}</Text>}
    </Animated.View>
  );
}

function LinkBtn({ icon, label, url, bg }: { icon: React.ReactNode; label: string; url: string; bg: string }) {
  return (
    <Pressable style={[styles.linkBtn, { backgroundColor: bg }]} onPress={() => Linking.openURL(url)}>
      {icon}
      <Text style={styles.linkBtnText}>{label}</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.hero}>
          <Text style={styles.heroTitle}>
            About{' '}
            <Text style={styles.heroGate}>GATE</Text>
            <Text style={styles.heroQuest}>Quest</Text>
          </Text>
          <Text style={styles.heroSub}>
            My Mission: Have a community of great people within my reach.
          </Text>
        </Animated.View>

        {/* Why GATEQuest card */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Book size={26} color="#3b82f6" weight="duotone" />
            <Text style={styles.cardTitle}>Why GATEQuest?</Text>
          </View>
          <Text style={styles.cardBody}>
            There are many websites great for GATE prep out there like GO or Examside but the UI felt less modern to me. I wanted to provide a clean, distraction-free UI — so here it is.
          </Text>
        </Animated.View>

        {/* Join Me card */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={26} color="#f87171" weight="duotone" />
            <Text style={styles.cardTitle}>Join Me</Text>
          </View>
          <Text style={styles.cardBody}>
            I want this to become everyone's go-to app for GATE prep. Contributions are highly appreciated.
          </Text>
          <View style={styles.btnGrid}>
            <LinkBtn
              icon={<GithubLogo size={16} color="#fff" weight="fill" />}
              label="GitHub"
              url="https://github.com/Razen04/GATEQuest"
              bg="#1e293b"
            />
            <LinkBtn
              icon={<DiscordLogo size={16} color="#fff" weight="fill" />}
              label="Discord"
              url="https://discord.gg/dFmg3g52c5"
              bg="#5865f2"
            />
          </View>
          <Pressable
            style={styles.chaiBtn}
            onPress={() => Linking.openURL('https://www.buymeacoffee.com/gatequest')}
          >
            <Coffee size={16} color="#fff" weight="fill" />
            <Text style={styles.chaiBtnText}>Buy Me A Chai ☕</Text>
          </Pressable>
        </Animated.View>

        {/* FAQ */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} index={i} />
          ))}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 100 },

  // Hero
  hero: { alignItems: 'center', paddingVertical: 32, marginBottom: 8 },
  heroTitle: { fontSize: 38, fontWeight: '900', textAlign: 'center', color: '#f1f5f9', lineHeight: 46 },
  heroGate: { color: '#3b82f6' },
  heroQuest: { color: '#f1f5f9' },
  heroSub: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 10, maxWidth: 280, lineHeight: 20 },

  // Cards
  card: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#334155', marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  cardBody: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },

  // Link buttons
  btnGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  linkBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  linkBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chaiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#16a34a', borderRadius: 10,
    paddingVertical: 11, marginTop: 10,
  },
  chaiBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // FAQ
  faqHeading: { color: '#f1f5f9', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20, marginTop: 8 },
  faqItem: {
    backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#334155', overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  faqAnswer: { color: '#94a3b8', fontSize: 13, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 14 },
});
