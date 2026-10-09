"""Add medical platform models

Revision ID: a1b2c3d4e5f6
Revises: f3f9fd90e2e7
Create Date: 2026-10-09 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f3f9fd90e2e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # patient_medical_profiles
    op.create_table('patient_medical_profiles',
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('date_of_birth', sa.String(), nullable=True),
        sa.Column('sex', sa.String(), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('dietary_preference', sa.String(), nullable=True),
        sa.Column('dietary_restrictions', sa.Text(), nullable=True),
        sa.Column('lifestyle_notes', sa.Text(), nullable=True),
        sa.Column('gi_history_notes', sa.Text(), nullable=True),
        sa.Column('family_history_notes', sa.Text(), nullable=True),
        sa.Column('profile_completeness', sa.Float(), nullable=True, default=0.0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('profile_id')
    )
    op.create_index('ix_patient_medical_profiles_user_id', 'patient_medical_profiles', ['user_id'], unique=True)

    # medical_documents
    op.create_table('medical_documents',
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('original_filename', sa.String(), nullable=True),
        sa.Column('file_type', sa.String(), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('storage_path', sa.String(), nullable=True),
        sa.Column('document_type', sa.String(), nullable=True),
        sa.Column('document_date', sa.String(), nullable=True),
        sa.Column('issuing_facility', sa.String(), nullable=True),
        sa.Column('issuing_clinician', sa.String(), nullable=True),
        sa.Column('processing_status', sa.String(), nullable=True, default='pending'),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('raw_extracted_text', sa.Text(), nullable=True),
        sa.Column('ai_consent_given', sa.Integer(), nullable=True, default=0),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('document_id')
    )
    op.create_index('ix_medical_documents_document_id', 'medical_documents', ['document_id'], unique=False)
    op.create_index('ix_medical_documents_user_id', 'medical_documents', ['user_id'], unique=False)

    # medical_record_extractions
    op.create_table('medical_record_extractions',
        sa.Column('extraction_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('field_type', sa.String(), nullable=True),
        sa.Column('field_name', sa.String(), nullable=True),
        sa.Column('extracted_value', sa.Text(), nullable=True),
        sa.Column('extracted_unit', sa.String(), nullable=True),
        sa.Column('reference_range', sa.String(), nullable=True),
        sa.Column('document_date', sa.String(), nullable=True),
        sa.Column('original_text', sa.Text(), nullable=True),
        sa.Column('confidence_note', sa.String(), nullable=True),
        sa.Column('information_source', sa.String(), nullable=True, default='document'),
        sa.Column('review_status', sa.String(), nullable=True, default='pending'),
        sa.Column('user_correction', sa.Text(), nullable=True),
        sa.Column('extracted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['medical_documents.document_id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('extraction_id')
    )
    op.create_index('ix_medical_record_extractions_user_id', 'medical_record_extractions', ['user_id'], unique=False)

    # patient_conditions
    op.create_table('patient_conditions',
        sa.Column('condition_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('condition_name', sa.String(), nullable=True),
        sa.Column('condition_type', sa.String(), nullable=True),
        sa.Column('onset_date', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, default='active'),
        sa.Column('source_type', sa.String(), nullable=True, default='user_reported'),
        sa.Column('source_document_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['source_document_id'], ['medical_documents.document_id']),
        sa.PrimaryKeyConstraint('condition_id')
    )
    op.create_index('ix_patient_conditions_user_id', 'patient_conditions', ['user_id'], unique=False)

    # patient_allergies
    op.create_table('patient_allergies',
        sa.Column('allergy_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('allergen_name', sa.String(), nullable=True),
        sa.Column('allergy_type', sa.String(), nullable=True, default='suspected'),
        sa.Column('reaction_description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('source_type', sa.String(), nullable=True, default='user_reported'),
        sa.Column('source_document_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['source_document_id'], ['medical_documents.document_id']),
        sa.PrimaryKeyConstraint('allergy_id')
    )
    op.create_index('ix_patient_allergies_user_id', 'patient_allergies', ['user_id'], unique=False)

    # patient_medications
    op.create_table('patient_medications',
        sa.Column('medication_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('medication_name', sa.String(), nullable=True),
        sa.Column('medication_type', sa.String(), nullable=True, default='medication'),
        sa.Column('dose', sa.String(), nullable=True),
        sa.Column('frequency', sa.String(), nullable=True),
        sa.Column('start_date', sa.String(), nullable=True),
        sa.Column('end_date', sa.String(), nullable=True),
        sa.Column('gi_concern_notes', sa.Text(), nullable=True),
        sa.Column('source_type', sa.String(), nullable=True, default='user_reported'),
        sa.Column('source_document_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Integer(), nullable=True, default=1),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['source_document_id'], ['medical_documents.document_id']),
        sa.PrimaryKeyConstraint('medication_id')
    )
    op.create_index('ix_patient_medications_user_id', 'patient_medications', ['user_id'], unique=False)

    # lab_results
    op.create_table('lab_results',
        sa.Column('lab_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('test_name', sa.String(), nullable=True),
        sa.Column('test_value', sa.String(), nullable=True),
        sa.Column('unit', sa.String(), nullable=True),
        sa.Column('reference_range', sa.String(), nullable=True),
        sa.Column('result_status', sa.String(), nullable=True),
        sa.Column('test_date', sa.String(), nullable=True),
        sa.Column('source_document_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['source_document_id'], ['medical_documents.document_id']),
        sa.PrimaryKeyConstraint('lab_id')
    )
    op.create_index('ix_lab_results_user_id', 'lab_results', ['user_id'], unique=False)

    # symptom_entries
    op.create_table('symptom_entries',
        sa.Column('symptom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('entry_date', sa.String(), nullable=True),
        sa.Column('entry_time', sa.String(), nullable=True),
        sa.Column('bloating', sa.Integer(), nullable=True, default=0),
        sa.Column('abdominal_pain', sa.Integer(), nullable=True, default=0),
        sa.Column('gas', sa.Integer(), nullable=True, default=0),
        sa.Column('constipation', sa.Integer(), nullable=True, default=0),
        sa.Column('diarrhea', sa.Integer(), nullable=True, default=0),
        sa.Column('nausea', sa.Integer(), nullable=True, default=0),
        sa.Column('heartburn', sa.Integer(), nullable=True, default=0),
        sa.Column('bowel_frequency', sa.Integer(), nullable=True),
        sa.Column('stool_type', sa.String(), nullable=True),
        sa.Column('severity_overall', sa.Integer(), nullable=True, default=0),
        sa.Column('meals_noted', sa.Text(), nullable=True),
        sa.Column('stress_level', sa.Integer(), nullable=True),
        sa.Column('sleep_hours', sa.Float(), nullable=True),
        sa.Column('hydration_glasses', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('symptom_id')
    )
    op.create_index('ix_symptom_entries_user_id', 'symptom_entries', ['user_id'], unique=False)

    # clinical_recommendations
    op.create_table('clinical_recommendations',
        sa.Column('rec_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('recommendation_text', sa.Text(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('evidence_references', sa.Text(), nullable=True),
        sa.Column('limitations', sa.Text(), nullable=True),
        sa.Column('patient_data_used', sa.Text(), nullable=True),
        sa.Column('is_urgent', sa.Integer(), nullable=True, default=0),
        sa.Column('generated_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('rec_id')
    )
    op.create_index('ix_clinical_recommendations_user_id', 'clinical_recommendations', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('clinical_recommendations')
    op.drop_table('symptom_entries')
    op.drop_table('lab_results')
    op.drop_table('patient_medications')
    op.drop_table('patient_allergies')
    op.drop_table('patient_conditions')
    op.drop_table('medical_record_extractions')
    op.drop_table('medical_documents')
    op.drop_table('patient_medical_profiles')
