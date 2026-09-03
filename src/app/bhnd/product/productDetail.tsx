import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productService } from '../../../services/productService';
import { Product } from '../../../types/product';
import { Header } from '../../../components/common/Header';
import { Loading } from '../../../components/common/Loading';
import { Button } from '../../../components/common/Button';
import { formatPrice } from '../../../utils/formatting';
import { useCart } from '../../../hooks/useCart';

export default function ProductDetailScreen() {
	const params = useLocalSearchParams();
	const id = (params?.id as string) || (params?.productId as string) || undefined;
	const router = useRouter();

	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [quantity, setQuantity] = useState<number>(1);
	const [adding, setAdding] = useState<boolean>(false);

	const { addItem } = useCart();

	useEffect(() => {
		const load = async () => {
			if (!id) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const p = await productService.getProductById(id);
				setProduct(p);
			} catch (err) {
				console.warn('Failed to load product', err);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [id]);

	const onAddToCart = async () => {
		if (!product) return;
		setAdding(true);
		try {
			// Use product.id as both productId and availableProductId when AvailableProduct not present
			await addItem(product.id || String(product.id), product.id || String(product.id), quantity, product.price || 0);
			router.push('/bhnd/(main)/cart');
		} catch (err) {
			console.warn('Failed to add to cart', err);
		} finally {
			setAdding(false);
		}
	};

	if (loading) return <Loading />;

	if (!product) {
		return (
			<View style={styles.container}>
				<Header title="Chi tiết sản phẩm" />
				<View style={styles.empty}>
					<Text>Không tìm thấy sản phẩm.</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Header title="Chi tiết sản phẩm" />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{product.images && product.images.length > 0 ? (
					<Image source={{ uri: product.images[0] || product.image }} style={styles.image} />
				) : (
					<Image source={{ uri: product.image }} style={styles.image} />
				)}

				<View style={styles.info}>
					<Text style={styles.name}>{product.name}</Text>
					<Text style={styles.price}>{formatPrice(product.price)}</Text>
					<Text style={styles.specs}>{product.specifications}</Text>

					<Text style={styles.desc}>{product.description}</Text>

					<View style={styles.quantityRow}>
						<TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
							<Text style={styles.qtyText}>−</Text>
						</TouchableOpacity>

						<Text style={styles.quantity}>{quantity}</Text>

						<TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
							<Text style={styles.qtyText}>+</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.actions}>
						<Button label="Thêm vào giỏ hàng" onPress={onAddToCart} loading={adding} />
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F5F5F5' },
	content: { padding: 16, paddingBottom: 40 },
	image: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#fff' },
	info: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
	name: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8 },
	price: { fontSize: 20, fontWeight: '800', color: '#FF6B00', marginBottom: 8 },
	specs: { fontSize: 13, color: '#666', marginBottom: 8 },
	desc: { fontSize: 14, color: '#444', marginBottom: 12 },
	quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 16 },
	qtyBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
	qtyText: { fontSize: 20, fontWeight: '700', color: '#333' },
	quantity: { fontSize: 16, fontWeight: '700', marginHorizontal: 12 },
	actions: { marginTop: 8 },
	empty: { padding: 24, alignItems: 'center' },
});

